import * as GraphQL from "@atomist/automation-client/graph/graphQL";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Tags,
    Secret,
    Secrets,
    HandleCommand,
    CommandHandler,
    Parameter,
    MappedParameters,
    MappedParameter,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { PushWithRepoSubscription } from "../schema";
import { teamStream } from "../action-board/helpers";
import { authorizeWithGithubToken, FailureReport, isFailureReport, commonTravisHeaders, logFromJobId, publicTravisEndpoint, jobIdForBuild } from "./travis/stuff";
import axios from "axios";

import * as slack from "@atomist/slack-messages/SlackMessages";
import { analyzeLog } from "./travis/grammar";
import * as _ from "lodash";

const byStatus = `subscription FailedBuildLog {
  Status {
      _id
    targetUrl
    context
    state
    commit {
      repo {
        name
        owner
        links {
        channel {
          name
        }
      }
    }
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
// const subscription = `
// subscription PushWithRepo {
//   Build(provider: "travis") {
//     buildUrl
//     status
//     name
//     provider
//     commit {
//       sha
//       author {
//         login
//         person {
//             chatId {
//                 screenName
//             }
//         }
//       }
//     }
//     repo {
//       name
//       owner
//     }
//   }
// }
// `

@EventHandler("Provide the end of the log on failed build",
    byStatus)
@Tags("travis")
export class FailedBuildLog implements HandleEvent<any> {

    @Secret(Secrets.ORG_TOKEN)
    public githubToken: string;

    public handle(e: EventFired<any>, ctx: HandlerContext): Promise<any> {
        logger.info(`Incoming event is %s`, JSON.stringify(e.data, null, 2));

        const travisApiEndpoint = publicTravisEndpoint;
        const githubToken = this.githubToken;
        const statusData = e.data.Status[0];

        ctx.messageClient.addressUsers(`Got a status with id ${statusData._id}`, "jessitron");

        if (statusData.context !== "continuous-integration/travis-ci/push" ||
            statusData.state !== "failure") {
            console.log(`this status event is not a failed Travis push build: ${JSON.stringify(statusData)}`);
            return Promise.resolve({ code: 0 })
        } else {
            const author: { screenName: string } | string = // string means error
                !statusData.commit ? "No commit on status" :
                    !statusData.commit.author ? "No author on commit" :
                        !statusData.commit.author.person ? "No person on author, GH login " + statusData.commit.author.login :
                            !statusData.commit.author.person.chatId ? "No chat ID on person " + statusData.commit.author.login :
                                !statusData.commit.author.person.chatId.screenName ?
                                    "No screen name on chatId for person " + + statusData.commit.author.login :
                                    { screenName: statusData.commit.author.person.chatId.screenName };


            const buildUrl = statusData.targetUrl.replace(new RegExp(`^https://.*/(.*/.*/builds/[0-9]*).*$`), travisApiEndpoint + "/repos/$1")
            const logFuture: Promise<string> =
                getLogSummary(travisApiEndpoint, githubToken, buildUrl).
                    then(log => {
                        if (isFailureReport(log)) {
                            return `Failed to retrieve log. While ${log.circumstance}, ${log.error}`;
                        } else {
                            return log;
                        }
                    });

            return logFuture.then(log => {

                const text =
                    `I saw a failed build: ${statusData.targetUrl} with context ${statusData.context}`;
                const logAttachment = {
                    fallback: "log goes here",
                    text: log
                }
                const slackMessage: slack.SlackMessage = {
                    text,
                    attachments: [logAttachment]
                }

                const channel: string = _.get(statusData, "commit.repo.links[0].channel.name");

                if (channel) {
                    ctx.messageClient.addressChannels(slackMessage,
                        channel);
                }

                if (typeof author === "string") {
                    ctx.messageClient.addressChannels(
                        `There was a failed build here: ${statusData.targetUrl} but I couldn't figure out whose it is. ${author}`,
                        teamStream);
                } else {
                    ctx.messageClient.addressUsers(
                        slackMessage, author.screenName);
                }

                return Promise.resolve({ code: 0 });
            });
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

    const jobId = buildPromise.then(b => {
        if (isFailureReport(b)) { return b } else {
            const jobIds = b.build.job_ids;
            if (!jobIds || jobIds.length < 1) {
                return {
                    circumstance: `getting job IDs out of build ${b.build.id} info: ${jobIds}`,
                    error: "No job ID"
                }
            }
            return jobIds[0];
        }
    });
    const logPromise = logFromJobId(travisApiEndpoint, jobId);

    return logPromise.then(log => {
        if (isFailureReport(log)) { return log } else {
            return analyzeLog(log);
        }
    })
}


interface TravisBuild {
    build: {
        id: number,
        job_ids: number[],
        state: string,
    }
}


@CommandHandler("Fetch a build log from Travis", "summarize build log")
@Tags("travis")
export class DistillBuildLog implements HandleCommand {

    @Parameter({ pattern: /^[0-9]+$/ })
    public buildNumber: string;

    @MappedParameter(MappedParameters.GITHUB_REPOSITORY)
    public repository;

    @MappedParameter(MappedParameters.GITHUB_REPO_OWNER)
    public owner;

    @Secret(Secrets.USER_TOKEN)
    public githubToken;

    handle(ctx: HandlerContext): Promise<HandlerResult> {
        const githubToken = this.githubToken;
        const repoSlug = `${this.owner}/${this.repository}`;
        const travisApiEndpoint = publicTravisEndpoint;
        const buildNumber = this.buildNumber;

        const auth = authorizeWithGithubToken(travisApiEndpoint, githubToken);

        const jobId = jobIdForBuild(travisApiEndpoint, auth, repoSlug, buildNumber);

        const log = logFromJobId(travisApiEndpoint, jobId)

        return log.then(logText => {
            if (isFailureReport(logText)) {
                ctx.messageClient.respond(`Log fetch failed when ${logText.circumstance}: ${logText.error}`);
                return { code: 1 }
            } else {
                const msg: slack.SlackMessage = {
                    text: `Here is a piece of the log for build ${buildNumber}`,
                    attachments: [{
                        fallback: "log goes here",
                        text: analyzeLog(logText)
                    }]
                }
                ctx.messageClient.respond(msg)
                return { code: 0 }
            }
        })
    }

}