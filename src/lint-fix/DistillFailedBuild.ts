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
import { PushWithRepoSubscription } from "../schema";
import { teamStream } from "../action-board/helpers";
import { authorizeWithGithubToken, FailureReport, isFailureReport, commonTravisHeaders, logFromJobId } from "./travis/stuff";
import axios as "axios";

const byStatus = `subscription FailedBuildByStatus {
  Status {
    targetUrl
    context
    state
    repo {
        name
        owner
        links {
        channel {
          name
        }
      }
    }
    commit {
      author {
        login
        person {
          forename
          chatId {
            screenName
          }
        }
      }
    }
  }
}
`
const subscription = `
subscription PushWithRepo {
  Build(provider: "travis") {
    buildUrl
    status
    name
    provider
    commit {
      sha
      author {
        login
        person {
            chatId {
                screenName
            }
        }
      }
    }
    repo {
      name
      owner
    }
  }
}
`

@EventHandler("Provide the end of the log on failed build",
    byStatus)
@Tags("travis")
export class FailedBuildLog implements HandleEvent<any> {

    public handle(e: EventFired<any>, ctx: HandlerContext): Promise<any> {
        logger.info(`Incoming event is %s`, JSON.stringify(e.data, null, 2));

        const statusData = e.data.Status[0];

        if (statusData.context === "continuous-integration/travis-ci/push" &&
            statusData.state === "failure") {
            const author: { screenName: string } | string = // string means error
                !statusData.commit ? "No commit on status" :
                    !statusData.commit.author ? "No author on commit" :
                        !statusData.commit.author.person ? "No person on author, GH login " + statusData.commit.author.login :
                            !statusData.commit.author.person.chatId ? "No chat ID on person " + statusData.commit.author.login :
                                !statusData.commit.author.person.chatId.screenName ?
                                    "No screen name on chatId for person " + + statusData.commit.author.login :
                                    { screenName: statusData.commit.author.person.chatId.screenName }

            if (typeof author === "string") {
                ctx.messageClient.addressChannels(
                    `There was a failed build here: ${statusData.targetUrl} but I couldn't figure out whose it is. ${author}`,
                    teamStream)
                return Promise.resolve({ code: 1 });
            }

            const channel = statusData.repo.links && (statusData.repo.links.length > 1)
                && statusData.repo.links[0].channel.name;

            if (channel) {
                ctx.messageClient.addressChannels(
                    `I saw a failed build: ${statusData.targetUrl} with context ${statusData.context} `,
                    channel);
            }

            ctx.messageClient.addressUsers(
                `I saw your failed build: ${statusData.targetUrl} with context ${statusData.context} `,
                author.screenName)
            return Promise.resolve({ code: 0 });
        } else {
            console.log(`this status event is not a failed Travis build: ${JSON.stringify(statusData)}`);
            return Promise.resolve({ code: 0 })
        }
    }
}

function getLogSummary(travisApiEndpoint: string, githubToken: string,
    buildUrl: string): Promise<string | FailureReport> {
    const auth = authorizeWithGithubToken(travisApiEndpoint, githubToken);

    const buildPromise: Promise<TravisBuild | FailureReport> = auth.then(a => {
        if (isFailureReport(a)) { return a } else {
            const url = buildUrl;
            return axios.get(url,
                {
                    headers: {
                        ...commonTravisHeaders,
                        "Authorization": `token ${a.access_token}`
                    }
                }).then(response => {
                    const data = response.data as TravisBuild;
                    if (!data.build) {
                        return {
                            circumstance: "Fetched build with: " + url,
                            error: "There was no build returned",
                        }
                    }
                    console.log("Received: " + JSON.stringify(data));
                    return data;
                }).catch(e => {
                    logger.error("Failure retrieving build: " + e)
                    return {
                        circumstance: "getting: " + url,
                        error: e
                    }
                })
        }
    });

    const logPromise = buildPromise.then(b => {
        if (isFailureReport(b)) { return b } else {
            const jobIds = b.build.job_ids;
            if (!jobIds || jobIds.length < 1) {
                return {
                    circumstance: `getting job IDs out of build ${b.build.id} info: ${jobIds}`,
                    error: "No job ID"
                }
            }
            return logFromJobId(travisApiEndpoint, jobIds[0]);
        }
    });

    return logPromise.then(log => {
        if (isFailureReport(log)) { return log } else {
            return analyzeLog(log);
        }
    })
}

function analyzeLog(log: string): string {
    return log;
}

interface TravisBuild {
    build: {
        id: number,
        job_ids: number[],
        state: string,
    }
}