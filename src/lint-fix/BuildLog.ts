import { MappedParameter } from "@atomist/automation-client/decorators";
import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult, MappedParameters,
    Parameter,
    Tags,
    Secret,
    Secrets,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import axios from 'axios';
import { authorizeWithGithubToken, commonTravisHeaders, TravisAuth, FailureReport, isFailureReport } from "./travis/stuff";


@CommandHandler("Fetch a build log from Travis", "fetch build log")
@Tags("travis")
export class BuildLog implements HandleCommand {

    @Parameter({ pattern: /^.*$/ })
    public buildNumber: string = "265";

    @Secret(Secrets.USER_TOKEN)
    public githubToken: string;


    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        logger.info(`Trying to fetch build logs for `);

        const orgRepo = "atomist/microgrammar";
        const travisApiEndpoint = "https://api.travis-ci.org";
        const buildNumber = this.buildNumber;
        const githubToken = this.githubToken;

        const auth: Promise<TravisAuth | FailureReport> =
            authorizeWithGithubToken(travisApiEndpoint, githubToken);

        const buildInfo: Promise<TravisBuilds | FailureReport> = auth.then(a => {
            if (isFailureReport(a)) { return a } else {
                const url = `${travisApiEndpoint}/repos/${orgRepo}/builds?number=${buildNumber}`
                return axios.get(url,
                    {
                        headers: {
                            ...commonTravisHeaders,
                            "Authorization": `token ${a.access_token}`
                        }
                    }).then(response => {
                        const data = response.data as TravisBuilds;
                        if (data.builds.length === 0) {
                            return {
                                circumstance: "Fetched build with: " + url,
                                error: "There are no builds returned",
                            }
                        }
                        console.log("Received: " + JSON.stringify(response.data));
                        return data;
                    }).catch(e => {
                        logger.error("Failure retrieving repo: " + e)
                        return {
                            circumstance: "getting: " + url,
                            error: e
                        }
                    })
            }
        });

        const logText: Promise<string | FailureReport> = buildInfo.then(b => {
            if (isFailureReport(b)) { return b } else {
                const jobIds = b.builds[0].job_ids
                console.log("Job IDs: " + JSON.stringify(jobIds));
                if (!jobIds || jobIds.length === 0) {
                    return {
                        circumstance: `getting job IDs out of build ${b.builds[0].id} info: ${jobIds}`,
                        error: "no Job ID",
                    }
                }
                const jobId = jobIds[0]; // can there be more than one? what does it mean if there is?
                const url = `${travisApiEndpoint}/jobs/${jobId}/log`
                // what happens if this is not available yet? I do not know. Then would we have a log ID in the job info?
                // because we don't have that, in this old build.
                return axios.get(url,
                    {
                        headers: {
                            ...commonTravisHeaders,
                            "Accept": "text/plain"
                        }
                    }).then(response => {
                        const data = response.data as string;
                        console.log("Received: " + JSON.stringify(response.data));
                        return data;
                    }).catch(e => {
                        logger.error("Failure retrieving build: " + e)
                        return {
                            circumstance: "getting: " + url,
                            error: e
                        }
                    })
            }
        })

        return logText.then(c => {
            if (isFailureReport(c)) {
                ctx.messageClient.respond(`I couldn't retrieve the build logs. When I tried to ${c.circumstance}, I got an error: ${c.error}`)
                return { code: 1 };
            } else {
                ctx.messageClient.respond(c);
                return { code: 0 };
            }
        })

    }
}

interface TravisBuilds {
    builds: {
        id: number,
        job_ids: number[],
        state: string,
    }[],
    commits: {
        id: number,
        sha: string,
        branch: string,
    }[]
}

