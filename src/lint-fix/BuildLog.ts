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
import { authorizeWithGithubToken, commonTravisHeaders, TravisAuth, FailureReport, isFailureReport, logFromJobId, publicTravisEndpoint, jobIdForBuild } from "./travis/stuff";


@CommandHandler("Fetch a build log from Travis", "fetch build log")
@Tags("travis")
export class BuildLog implements HandleCommand {

    @Parameter({ pattern: /^.*$/ })
    public buildNumber: string = "265";

    @Secret(Secrets.USER_TOKEN)
    public githubToken: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {

        const orgRepo = "atomist/microgrammar";
        const travisApiEndpoint = publicTravisEndpoint;
        const buildNumber = this.buildNumber;
        const githubToken = this.githubToken;

        const auth: Promise<TravisAuth | FailureReport> =
            authorizeWithGithubToken(travisApiEndpoint, githubToken);

        const buildInfo = jobIdForBuild(travisApiEndpoint, auth, orgRepo, buildNumber)

        const logText = logFromJobId(travisApiEndpoint, buildInfo);

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
