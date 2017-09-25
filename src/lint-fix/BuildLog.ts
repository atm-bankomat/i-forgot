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

const commonTravisHeaders = {
    "User-Agent": "MyClient/1.0.0",
    "Accept": "application/vnd.travis-ci.2+json"
}

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

        /*POST /auth/github HTTP/1.1
User-Agent: MyClient/1.0.0
Accept: application/vnd.travis-ci.2+json
Host: api.travis-ci.org
Content-Type: application/json
Content-Length: 37

{"github_token":"YOUR GITHUB TOKEN"} */
        const auth: Promise<TravisAuth | FailureReport> =
            axios.post(`${travisApiEndpoint}/auth/github`,
                { "github_token": githubToken },
                {
                    headers: {
                        ...commonTravisHeaders,
                        "Content-Type": "application/json"
                    }
                }).then(response => {
                    console.log("Received: " + JSON.stringify(response.data))
                    return response.data as TravisAuth
                }).catch(e => {
                    logger.error("Failure authenticating with Travis: " + e)
                    return {
                        circumstance: "Failure authenticating with Travis: ",
                        error: e
                    }
                })

        const buildInfo = auth.then(a => {
            if (isFailureReport(a)) { return a } else {
                const url = `${travisApiEndpoint}/repos/${orgRepo}/builds?number=${buildNumber}`
                return axios.get(url,
                    {
                        headers: {
                            ...commonTravisHeaders,
                            "Authorization": `token ${a.access_token}`
                        }
                    }).then(response => {
                        console.log("Received: " + JSON.stringify(response.data))
                        return response.data
                    }).catch(e => {
                        logger.error("Failure retrieving build: " + e)
                        return {
                            circumstance: "Failure getting: " + url,
                            error: e
                        }
                    })
            }
        });

        return buildInfo.then(data => {
            ctx.messageClient.respond(JSON.stringify(data, null, 2);
            return { code: 0 };
        })

    }
}

interface TravisAuth {
    access_token: string
}

function isFailureReport(z: any): z is FailureReport {
    return z["circumstance"] !== undefined && z["error"] !== undefined
}
interface FailureReport {
    circumstance: string,
    error: any
}