import axios from 'axios';
import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    Parameter,
    Tags,
    MappedParameter,
    MappedParameters,
    Secret,
    Secrets,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { teamStream } from "./helpers";
import { globalActionBoardTracker, ActionBoardSpecifier, ActionBoardActivity } from './globalState';

@CommandHandler("Complete this lovely issue", "I am all done with this one")
@Tags("action-board")
export class CloseIssue implements HandleCommand {
    public static Name = "CloseIssue";

    @MappedParameter(MappedParameters.SLACK_USER)
    public slackUser: string;

    @MappedParameter("atomist://github/username")
    public githubName: string;

    @Secret(Secrets.USER_TOKEN)
    public githubToken: string;

    @Parameter({ pattern: /^.*$/ })
    public issueUrl: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        const issueUrl = this.issueUrl;
        const githubToken = this.githubToken;
        const githubName = this.githubName;
        const slackUser = this.slackUser;

        ctx.messageClient.addressChannels(
            `${slack.user(slackUser)} closed this issue: ` + this.issueUrl,
            teamStream);

        const issueResource = encodeURI(`${issueUrl}?state=closed`);

        return axios({
            method: 'patch',
            url: issueResource,
            headers: { Authorization: `token ${githubToken}` }
        }).then((response) => {
            logger.info(`Successfully closed ${issueUrl}`)
            return Promise.resolve({ code: 0 })
        }).catch(error => {
            ctx.messageClient.respond(`Failed to close ${issueUrl} ${error}`)
            return Promise.resolve({ code: 1 })
        })
    }
}

