import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Secret,
    Secrets,
    Success,
    Tags,
} from "@atomist/automation-client/Handlers";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { doWithFileMatches } from "@atomist/automation-client/project/util/parseUtils";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import * as _ from "lodash";
import { FailureReport, isFailureReport } from "../lint-fix/travis/stuff";
import { Failure } from "@atomist/automation-client/HandlerResult";

const Query = `
subscription StartDownstreamTests 
{
  Build(trigger: pull_request, status: passed) {
    buildUrl
    name
    provider
    trigger
    pullRequest {
      number
      head {
        sha
        tags {
          name
        }
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
        const upstreamRepo = { owner: "atm-bankomat", name: "microgrammar" };
        const downstreamRepo = { owner: "atm-bankomat", name: "automation-client-samples-ts" };
        const [newDependency, newVersion] = parseCascadeTag(_.get(build, "pullRequest.head.tags" ));
        const realPublishedModule = "@atomist/microgrammar";
        const commitMessage = `Test ${realPublishedModule} for ${upstreamRepo}#${build.pullRequest.number}`;

        if (repoSlug === slug(upstreamRepo)) {
            console.log(`Time to trigger a downstream build!`);

            return updateDependencyOnBranch(githubToken,
                { repo: downstreamRepo, branch, commitMessage },
                realPublishedModule, newDependency, newVersion)
                .then(() => Success)
                .catch(() => Failure);

        } else {
            console.log(`No downstream tests to trigger on a ${build.trigger} build from ${repoSlug}.`);
            return Promise.resolve(Success);
        }
    }
}

interface Repository {
    name: string;
    owner: string;
}
function slug(repository: Repository): string {
    return `${repository.name}/${repository.owner}`;
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
        if (isFailureReport(project)) { return project; } else {
            const oldDependency = Microgrammar.fromString(`"$name": "$version"`,
                {
                    name: dependencyToReplace,
                    version: /[0-9^.-]+/,
                },
            );

            return doWithFileMatches(project, "package.json", oldDependency, f => {
                const m = f.matches[0] as any;
                m.name = newDependency;
                m.version = newDependencyVersion;
            }).run().then(files => project as GitProject | FailureReport);
        }
    }).catch(error => ({ circumstance: "Editing package.json", error }));

    const commitAndPushToProject = editProject.then(project => {
        if (isFailureReport(project)) { return project; } else {
            commitAndPush(target, project);
        }
    }).catch(error => ({ circumstance: "Committing and pushing", error }));

    return commitAndPushToProject;
}

interface PushInstruction {
    branch: string;
    repo: Repository;
    commitMessage: string;
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
        });
}

export function parseCascadeTag(tags: any[]): [string, string] {
    // @atomist/microgrammar_cdupuis-patch-3-0.7.0
    if (tags && tags.length > 0) {
        const regex = /(.*)-([0-9]*.[0-9]*.[0-9]*)/
        const matches = regex.exec(tags[0].name);
        return [matches[1], matches[2]];
    } else {
        return null;
    }

}
