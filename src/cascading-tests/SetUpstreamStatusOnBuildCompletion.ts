import { EventHandler, Secret, Tags } from "@atomist/automation-client/decorators";
import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import {
    EventFired,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Secrets,
    Success
} from "@atomist/automation-client/Handlers";
import * as schema from "../typings/types";
import { AxiosPromise } from "axios";
import { setStatus } from "./setStatus";
import { BuildCompleted } from "../typings/types";
import Build = BuildCompleted.Build;

const upstreamRepo = "microgrammar";
const downstreamRepos = ["automation-client-samples-ts"];

/**
 * Set the build status on the upstream project when the build has completed
 */
@EventHandler("Event handler that notifies upstream PR of failed downstream build",
    GraphQL.subscriptionFromFile("graphql/cascadeBuildCompleted"))
@Tags("cascade", "build", "status")
export class SetUpstreamStatusOnBuildCompletion implements HandleEvent<schema.BuildCompleted.Subscription> {

    @Secret(Secrets.ORG_TOKEN)
    public githubToken: string;

    public handle(root: EventFired<schema.BuildCompleted.Subscription>,
                  ctx: HandlerContext): Promise<HandlerResult> {

        const build = root.data.Build[0];
        if (downstreamRepos.includes(build.repo.name)) {
            // Check the branch in the upstream repo. Does it have a PR?
            return this.upstreamHasPrWithBranch(ctx, upstreamRepo, build.push.branch)
                .then(upStreamHasBranch => {
                    if (upStreamHasBranch) {
                        return this.setUpstreamStatus(build, upstreamRepo)
                            .then(_ => Success)
                            .catch(err => {
                                return {
                                    code: 1,
                                    error: err,
                                }
                            });
                    }
                });
        }
        // If we get to here, we're not interested in this repo. Do nothing
        return Promise.resolve(Success);
    }

    private upstreamHasPrWithBranch(ctx: HandlerContext, upstreamRepo: string, branch: string): Promise<boolean> {
        return ctx.graphClient.executeFile<schema.PrWithBranch.Query, schema.PrWithBranch.Variables>(
            "graphql/PrWithBranch",
            {repoName: upstreamRepo, branch})
            .then(result => result.PullRequest.length > 0);
    }

    private setUpstreamStatus(build: Build, upstreamRepo: string): AxiosPromise {
        const state: "failure" | "success" = (build.status === "broken" || build.status === "failed") ?
            "failure" :
            "success";
        const status = {
            state,
            description: `Build status from ${build.repo.name}`,
        };
        return setStatus(this.githubToken, status, build.repo.owner,
            upstreamRepo, build.commit.sha
        );
    }
}
