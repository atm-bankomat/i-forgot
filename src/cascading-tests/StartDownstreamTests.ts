import { RepoId } from '@atomist/automation-client/operations/common/RepoId';
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Tags,
    Success,
    Secrets,
    Secret,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { FailureReport, isFailureReport } from "../lint-fix/travis/stuff";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as _ from 'lodash';
import { CommandResult } from '@atomist/automation-client/internal/util/commandLine';
import { Microgrammar } from '@atomist/microgrammar/Microgrammar';
import { doWithFileMatches } from '@atomist/automation-client/project/util/parseUtils';

const Query = `
subscription StartDownstreamTests {
    Build(trigger: pull_request, status: passed) {
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

    @Secret(Secrets.ORG_TOKEN)
    public githubToken: string;

    public handle(e: EventFired<any>, ctx: HandlerContext):
        Promise<HandlerResult> {

        const build = e.data.Build[0];
        const branch = build.branch;
        const githubToken = this.githubToken;
        const repoSlug = `${build.repo.name}/${build.repo.owner}`;
        const upstreamRepo = "atomist/microgrammar";
        const downstreamRepo = { owner: "atomist", name: "automation-client-samples-ts" };
        const [newDependency, newVersion] = parseCascadeTag(build.pullRequest.mergeCommit.tags)
        const realPublishedModule = "@atomist/microgrammar";
        const commitMessage = `Test ${realPublishedModule} for ${upstreamRepo}#${build.pullRequest.number}`


        if (repoSlug === slug(downstreamRepo)) {
            console.log(`Time to trigger a downstream build!`)

            updateDependencyOnBranch(githubToken,
                { repo: downstreamRepo, branch, commitMessage },
                realPublishedModule, newDependency, newVersion);


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

function updateDependencyOnBranch(githubToken: string,
    target: PushInstruction,
    dependencyToReplace: string,
    newDependency: string, newDependencyVersion: string): Promise<void | FailureReport> {

    // clone the target project.
    const cloneProject: Promise<GitProject | FailureReport> =
        GitCommandGitProject.cloned(githubToken, target.repo.owner, target.repo.name, target.branch).
            catch(e => ({ circumstance: `Cloning project ${slug(target.repo)}`, error: e }));

    const editProject: Promise<GitProject | FailureReport> = cloneProject.then(project => {
        if (isFailureReport(project)) { return project } else {
            let oldDependency = Microgrammar.fromString(`"$name": "$version"`,
                {
                    name: dependencyToReplace,
                    version: /[0-9^.-]+/
                }
            );

            return doWithFileMatches(project, "package.json", oldDependency, f => {
                let m = f.matches[0] as any;
                m.name = newDependency;
                m.version = newDependencyVersion;
            }).run().then(files => project as GitProject | FailureReport);
        }
    }).catch(error => ({ circumstance: "Editing package.json", error }));

    const commitAndPushToProject = editProject.then(project => {
        if (isFailureReport(project)) { return project } else {
            commitAndPush(target, project)
        }
    }).catch(error => ({ circumstance: "committing and pushing", error }));



    return Promise.resolve();
}


interface PushInstruction {
    branch: string,
    repo: Repository,
    commitMessage: string,
}

function commitAndPush(
    push: PushInstruction,
    project: GitProject): Promise<any> {

    return project.clean()
        .then(clean => {
            if (!clean) {
                return project.createBranch(push.branch)
                    .then(() => project.commit(push.commitMessage))
                    .then(() => project.push());
            } else {
                return Promise.resolve(Success);
            }
        })
}

function parseCascadeTag(tags: string[]): [string, string] {
    return ["@atomist/microgrammar_cascade", "0.6.3"]; // TODO: implement
}
