import {
    EventHandler,
    Secret,
} from "@atomist/automation-client/decorators";
import {
    HandlerContext,
    HandlerResult,
    Secrets,
    Success,
    EventFired,
    HandleEvent,
} from "@atomist/automation-client/Handlers";
import { exec } from "child-process-promise";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import * as graphql from "../typings/types";
import axios from "axios";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as _ from "lodash";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { FailureReport, isFailureReport } from "./travis/stuff";
import { teamStream } from "../action-board/helpers";

interface ExecResult {
    stdout: string,
    stderr: string,
    childProcess: {
        exitCode: number,
        spawnargs: string[],
    }
}
function fillInExecResult(command: string, e: any): ExecResult {
    const stuff = e || {}
    const exitCode = (stuff.childProcess && stuff.childProcess.exitCode) || (stuff.code) || 0;
    console.log("Perceived exit code is " + exitCode)
    return {
        stdout: "",
        stderr: "",
        ...stuff,
        childProcess: {
            exitCode: exitCode,
            spawnargs: [command],
            ...stuff.childProcess,
        }
    }
}

interface HasGitProject {
    gitProject: GitProject
}

interface HasExecResult {
    execResult: ExecResult
}
function execReturnedSuccess(r: HasExecResult): boolean {
    return r.execResult.childProcess.exitCode === 0;
}

interface HasLintStatus {
    allLintErrorsFixed: boolean,
    stubbornLintErrors?: string
}

function executeInProject<T extends object>(project: Promise<T & HasGitProject | Passthrough>, command: string):
    Promise<(T & HasGitProject & HasExecResult) | Passthrough> {
    return project.then(p => {
        if (isPassthrough(p)) { return p } else {
            console.log("Running command: " + command);
            return exec(command, { cwd: p.gitProject.baseDir }).
                catch(e => {
                    //console.log("Here is the error I get: " + JSON.stringify(e));
                    // nonzero exit codes can come here
                    if (e.name === "ChildProcessError" && e.code) {
                        return { ...(p as object), execResult: fillInExecResult(command, e) }
                    } else {
                        return { circumstance: command, error: e }
                    }
                }).
                then(r => {
                    if (isPassthrough(r)) { return r } else {
                        return ({ ...(p as object), execResult: fillInExecResult(command, r) })
                    }
                });
        }
    })

}

type Nevermind = { nevermind: string }
function isNevermind(t: any): t is Nevermind {
    return t.nevermind != undefined;
}

type Passthrough = Nevermind | FailureReport
function isPassthrough(t: any): t is Passthrough {
    if (t === null || t == undefined) {
        throw new Error("wtf is this doing being undefined")
    }
    return isNevermind(t) || isFailureReport(t)
}

@EventHandler("Runs ts tslint --fix on a given repository",
    GraphQL.subscriptionFromFile("graphql/pushForLinting"))
export class LintEveryBranch implements HandleEvent<graphql.PushToTsLinting.Subscription> {

    @Secret(Secrets.ORG_TOKEN)
    public githubToken: string;

    public handle(event: EventFired<graphql.PushToTsLinting.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const push = event.data.Push[0];
        const githubToken = this.githubToken;
        const repoName = push.repo.name;
        const repoOwner = push.repo.owner;
        const branch = push.branch;
        const commitMessage = `Autofix some linting errors\n\n[atomist:auto - delint]`
        const githubHtmlUrl = "https://github.com"

        if (push.after.message.indexOf("atomist:auto") >= 0) {
            console.log("Not running LintEveryBranch on my own commit");
            return Promise.resolve(Success)
        }

        const cloneProject: Promise<GitProject | FailureReport> =
            GitCommandGitProject.cloned(githubToken, repoOwner, repoName, branch).
                catch(e => ({ circumstance: `Cloning project ${repoOwner}/${repoName}`, error: e }));

        const shouldWeLint: Promise<HasGitProject | Passthrough> = cloneProject.then(project => {
            if (isPassthrough(project)) { return project } else {
                if (project.fileExistsSync("tslint.json")) {
                    return { gitProject: project }
                } else {
                    return { nevermind: "No tslint.json" }
                }
            }
        });

        const npmInstall: Promise<HasGitProject | Passthrough> = executeInProject(shouldWeLint, "npm install").
            then(output => {
                if (isPassthrough(output) || execReturnedSuccess(output)) { return output } else {
                    const result = output.execResult;
                    const ran = result.childProcess.spawnargs.join(" ");
                    return {
                        circumstance: `Running <${ran}>, exit code ${result.childProcess.exitCode}`,
                        error: `stderr: ${result.stderr}`
                    }
                }
            });

        const tsLint: Promise<HasGitProject | Passthrough> = executeInProject(npmInstall,
            "tslint '**/*.ts' --exclude 'node_modules/**' --exclude 'build/**' -t verbose").
            then(output => {
                if (isPassthrough(output)) { return output } else {
                    if (execReturnedSuccess(output)) {
                        return { nevermind: "tslint passed" }
                    } else {
                        return output
                    }
                }
            });


        const runFix: Promise<HasGitProject & HasLintStatus | Passthrough> = executeInProject(tsLint,
            "tslint --fix '**/*.ts' --exclude 'node_modules/**' --exclude 'build/**' -t verbose").
            then(output => {
                if (isPassthrough(output)) { return output } else {
                    if (execReturnedSuccess(output)) {
                        return { ...output, allLintErrorsFixed: true }
                    } else {
                        return { ...output, allLintErrorsFixed: false, stubbornLintErrors: output.execResult.stdout }
                    }
                }
            });

        const didWeChangeAnything: Promise<HasGitProject & HasLintStatus | Passthrough> = executeInProject(runFix,
            "git diff --exit-code").then(data => {
                if (isPassthrough(data)) { return data } else {
                    if (execReturnedSuccess(data)) {
                        return { nevermind: "There are errors, but tslint can't fix any of them" }
                    } else {
                        return data
                    }
                }
            });

        const createBranch: Promise<HasGitProject & HasLintStatus | Passthrough> = didWeChangeAnything.then(data => {
            if (isPassthrough(data)) { return data } else {
                return data.gitProject.createBranch(branch).
                    catch(error => ({ circumstance: `creating branch ${branch}`, error })).
                    then(a => data as HasGitProject & HasLintStatus | Passthrough); // no covariance, bummer
            }
        });

        const gitCommit: Promise<HasGitProject & HasLintStatus | Passthrough> = createBranch.then(data => {
            if (isPassthrough(data)) { return data } else {
                return data.gitProject.commit(commitMessage).
                    catch(error => ({ circumstance: `making commit`, error })).
                    then(a => data as HasGitProject & HasLintStatus | Passthrough); // no covariance, bummer
            }
        });

        const gitPush: Promise<HasGitProject & HasLintStatus | Passthrough> = gitCommit.then(data => {
            if (isPassthrough(data)) { return data } else {
                return data.gitProject.commit(commitMessage).
                    catch(error => ({ circumstance: `pushing`, error })).
                    then(a => data as HasGitProject & HasLintStatus | Passthrough); // no covariance, bummer
            }
        });

        const screenName: string = _.get(push, "after.author.person.chatId.screenName");
        const githubLogin: string = _.get(push, "after.author.login");
        const who = screenName || githubLogin || "someone";
        const branchUrl = `${githubHtmlUrl}/${repoOwner}/${repoName}/tree/${branch}`
        const where = slack.url(branchUrl, `${repoOwner}/${repoName}:${branch}`);

        const finalMessage: Promise<HasLintStatus | FailureReport | Nevermind> = gitPush.then(data => {
            if (isNevermind(data)) {
                ctx.messageClient.addressChannels(
                    `${who} pushed a commit to ${where}. I didn't make a lint-fix commit because ${data.nevermind}`,
                    teamStream).then(a => data)
            } else if (isFailureReport(data)) {
                ctx.messageClient.addressChannels(
                    `${who} pushed a commit to ${where}. I failed at fixing any linting errors because: during ${data.circumstance}, ${data.error}`,
                    teamStream).then(a => data)
            } else {
                // we made a lint fix
                const attachments = data.allLintErrorsFixed ? [] : [{
                    fallback: "linting errors",
                    header: "Unfortunately, there are errors I couldn't fix.",
                    text: data.stubbornLintErrors,
                    color: "#D94649",
                }];
                const text = screenName ?
                    `Hey, I pushed a commit to your branch ${where} to fix linting errors. You'll need to fetch.` :
                    `Yo, I pushed a commit to ${who}'s branch ${where} to fix linting errors. I don't know how to DM them.`;

                return screenName ?
                    ctx.messageClient.addressUsers({ text, attachments }, screenName).then(a => data) :
                    ctx.messageClient.addressChannels({ text, attachments }, teamStream).then(a => data)
            }
        });

        return finalMessage.then(data => {
            if (isFailureReport(data)) {
                return { code: 1 }
            } else {
                return Success
            }
        })
    }
}