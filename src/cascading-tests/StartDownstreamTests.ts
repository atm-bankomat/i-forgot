import { RepoId } from '@atomist/automation-client/operations/common/RepoId';
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Tags,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { FailureReport } from "../lint-fix/travis/stuff";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";

const Query = `
subscription StartDownstreamTests {
    Build {
       buildUrl
       name
       provider
       trigger
       commit {
         sha
         tags {
          name
         }
       }
       repo {
        name
        owner
        channels {
         name
        }
       }
     }
`;

@EventHandler("After a PR build, run downstream tests", Query)
@Tags("travis")
export class StartDownstreamTests implements HandleEvent<any> {

    public handle(e: EventFired<any>, ctx: HandlerContext):
        Promise<HandlerResult> {

        const build = e.data.Build[0];
        const repoSlug = `${build.repo.name}/${build.repo.owner}`;
        const upstreamRepo = "atomist/microgrammar";
        const downstreamRepo = "atomist/automation-client-samples-ts"

        if (build.trigger === "pull_request" && repoSlug === upstreamRepo) {
            console.log(`Time to trigger a downstream build!`)

            updateDependencyOnBranch();


        } else {
            console.log(`No downstream tests to trigger on a ${build.trigger} build from ${repoSlug}.`)
            return Promise.resolve({ code: 0 });
        }

        return Promise.all(e.data.Push.map(p =>
            ctx.messageClient.addressChannels(`Got a push with sha \`${p.after.sha}\``,
                p.repo.channels.map(c => c.name))))
            .then(() => {
                return Promise.resolve({ code: 0 });
            });
    }
}

interface Repository {
    name: string,
    owner: string,
}
function slug(repository: Repository): string {
    return `${repository.name}/${repository.owner}`
}

function updateDependencyOnBranch(githubToken: string, targetRepo: Repository, branch: string): Promise<void | FailureReport> {

    // clone the target project.
    const cloneProject: Promise<GitProject | FailureReport> =
        GitCommandGitProject.cloned(githubToken, targetRepo.owner, targetRepo.name, branch).
            catch(e => ({ circumstance: `Cloning project ${slug(targetRepo)}`, error: e }));



    return Promise.resolve();
}


interface PushInstruction {
    branch: string,
    repo: { owner: string, name: string },
    after: { sha: string }
}

function commitAndPush(
    push: PushInstruction,
    project: GitProject,
    result: CommandResult,
    baseDir: string,
    ctx: HandlerContext): Promise<any> {

    const exitCode: number = _.get(result, "childProcess.exitCode") || -42;
    return project.clean()
        .then(clean => {
            if (!clean) {
                return project.createBranch(push.branch)
                    .then(() => project.commit(`Automatic de-linting\n[atomist:auto-delint]`))
                    .then(() => project.push());
            } else {
                return Promise.resolve(Success);
            }
        })
        .then(() => {
            return raiseGitHubStatus(push.repo.owner, push.repo.name, push.after.sha,
                exitCode);
        });
}
