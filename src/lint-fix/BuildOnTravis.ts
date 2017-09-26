import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Tags,
    CommandHandler,
    HandleCommand,
    MappedParameter,
    MappedParameters,
    Secrets,
    Secret,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { PushWithRepoSubscription } from "../schema";
import { teamStream } from "../action-board/helpers";
import { authorizeWithGithubToken, isFailureReport, commonTravisHeaders, FailureReport, TravisAuth } from "./travis/stuff";
import axios from "axios";

@CommandHandler("Enable build on travis",
    "build on travis")
@Tags("travis")
export class BuildOnTravis implements HandleCommand {

    @MappedParameter(MappedParameters.GITHUB_REPOSITORY)
    public repository;

    @MappedParameter(MappedParameters.GITHUB_REPO_OWNER)
    public owner;

    @Secret(Secrets.USER_TOKEN)
    public githubToken;

    public handle(ctx: HandlerContext): Promise<any> {

        const travisApiEndpoint = "https://api.travis-ci.org";
        const githubToken = this.githubToken;
        const repoSlug = `${this.owner}/${this.repository}`

        const auth = authorizeWithGithubToken(travisApiEndpoint, githubToken);

        const repoPromise: Promise<TravisRepo & TravisAuth | FailureReport> =
            auth.then(a => {
                if (isFailureReport(a)) { return a } else {
                    const url = `${travisApiEndpoint}/repos/${repoSlug}`
                    return axios.get(url,
                        {
                            headers: {
                                ...commonTravisHeaders,
                                "Authorization": `token ${a.access_token}`
                            }
                        }).then(response => {
                            const data = response.data as TravisRepo;
                            if (!data.repo) {
                                return {
                                    circumstance: "Fetched repo with: " + url,
                                    error: "No repo was returned. Maybe it's time to add sync handling",
                                }
                            }
                            return { ...data, ...a };
                        }).catch(e => {
                            logger.error("Failure retrieving build: " + e)
                            return {
                                circumstance: "getting: " + url,
                                error: e
                            }
                        })
                }
            });

        const enablementPromise = repoPromise.then(r => {
            if (isFailureReport(r)) { return r } else {
                const url = `${travisApiEndpoint}/hooks`
                const postData =
                    { "hook": { "id": r.repo.id, "active": true } };
                return axios.post(url, postData,
                    {
                        headers: {
                            ...commonTravisHeaders,
                            "Authorization": `token ${r.access_token}`
                        }
                    }).then(response => {
                        return {}; // do we get anything useful?
                    }).catch(e => {
                        logger.error("Failure retrieving build: " + e)
                        return {
                            circumstance: `posting: ${url} with: ${JSON.stringify(postData)}`,
                            error: e
                        }
                    })
            }
        });

        return enablementPromise.then(c => {
            if (isFailureReport(c)) {
                ctx.messageClient.respond(`I couldn't enable the Travis build. When I tried to ${c.circumstance}, I got an error: ${c.error}`)
                return { code: 1 };
            } else {
                ctx.messageClient.respond("Well, I think I enabled it. Hope it works.");
                return { code: 0 };
            }
        })
    }
}

interface TravisRepo {
    repo: { id: string }
}