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
import { setStatus } from "./setStatus";
import * as graphql from "../typings/types";
import * as GraphqQL from "@atomist/automation-client/graph/graphQL";

@EventHandler("After a PR build, run downstream tests",
    GraphqQL.subscriptionFromFile("graphql/startDownstreamTests"))
@Tags("travis")
export class StartDownstreamTests implements HandleEvent<graphql.StartDownstreamTests.Subscription> {

    @Secret(Secrets.ORG_TOKEN)
    public githubToken: string;

    public handle(e: EventFired<graphql.StartDownstreamTests.Subscription>,
                  ctx: HandlerContext): Promise<HandlerResult> {

        const build = e.data.Build[0];
        const branch = _.get(build, "pullRequest.branch.name") as string;
        const githubToken = this.githubToken;
        const repoSlug = `${build.repo.name}/${build.repo.owner}`;
        const upstreamRepo = {owner: "atm-bankomat", name: "microgrammar"};
        const downstreamRepo = {owner: "atm-bankomat", name: "automation-client-samples-ts"};
        const [newDependency, newVersion] = parseCascadeTag(_.get(build, "pullRequest.head.tags"));
        const realPublishedModule = "@atomist/microgrammar";
        const commitMessage = `Test ${realPublishedModule} for ${upstreamRepo.owner}/${upstreamRepo.name}#${build.pullRequest.number}`;

        if (repoSlug === slug(upstreamRepo)) {
            console.log(`Time to trigger a downstream build!`);

            return updateDependencyOnBranch(githubToken,
                {repo: downstreamRepo, branch, commitMessage},
                realPublishedModule, newDependency, newVersion, build)
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
                                  newDependency: string,
                                  newDependencyVersion: string,
                                  build: graphql.StartDownstreamTests.Build): Promise<HandlerResult | FailureReport> {

    // clone the target project.
    const cloneProject: Promise<GitProject | FailureReport> =
        GitCommandGitProject.cloned(githubToken, target.repo.owner, target.repo.name).catch(e => ({
            circumstance: `Cloning project ${slug(target.repo)}`,
            error: e
        }));

    const editProject: Promise<GitProject | FailureReport> = cloneProject.then(project => {
        if (isFailureReport(project)) {
            return project;
        } else {
            return doWithFileMatches(project, "package.json",
                dependencyGrammar(dependencyToReplace), f => {
                    const m = f.matches[0] as any;
                    m.name = newDependency;
                    m.version = newDependencyVersion;
                }).run().then(files => project as GitProject | FailureReport);
        }
    }).catch(error => ({circumstance: "Editing package.json", error}));

    const commitAndPushToProject = editProject.then(project => {
        if (isFailureReport(project)) {
            return project;
        } else {
            return commitAndPush(target, project);
        }
    }).catch(error => ({circumstance: "Committing and pushing", error}));

    const updateStatus = commitAndPushToProject.then(project => {
        if (isFailureReport(project)) {
            return Failure;
        } else if (project["pushed"]) {
            return setStatus(githubToken,
                { state: "pending", context: "downstream-test/atomist",
                    description: `Build status from ${target.repo.name}`,
                    target_url: `https://github.com/${project.owner}/${project.name}/tree/${target.branch}`},
                    build.repo.owner, build.repo.name, build.pullRequest.head.sha)
                .then(() => Success);
        } else {
            return Success;
        }
    }).catch(error => ({circumstance: "Setting status on upstream PR", error}));

    return updateStatus;
}

interface PushInstruction {
    branch: string;
    repo: Repository;
    commitMessage: string;
}

function commitAndPush(push: PushInstruction,
                       project: GitProject): Promise<GitProject | FailureReport> {

    return project.clean()
        .then(clean => {
            if (!clean) {
                project["pushed"] = true;
                return project.createBranch(push.branch)
                    .then(() => project.commit(push.commitMessage))
                    .then(() => project.push())
                    .then(() => project);
            } else {
                project["pushed"] = false;
                return Promise.resolve(project);
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

export function dependencyGrammar(dependencyToReplace: string) {
    return Microgrammar.fromString<Dependency>('"${name}": "${version}"',
        {
            name: dependencyToReplace,
            version: /[0-9^.-]+/,
        },
    );
}

export interface Dependency {
    name: string;
    version: string;
}