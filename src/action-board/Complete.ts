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
import { teamStream, inProgressLabelName } from "./helpers";
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



        const issueResource = encodeURI(`${issueUrl}`);

        const closePromise = axios({
            method: 'patch',
            url: issueResource,
            headers: { Authorization: `token ${githubToken}` },
            data: {
                "state": "closed"
            }
        }).then((response) => {
            logger.info(`Successfully closed ${issueUrl}`);
            ctx.messageClient.addressChannels(
                `${slack.user(slackUser)} closed this issue: ` + this.issueUrl,
                teamStream);
            return { code: 0 };
        }).catch(error => {
            ctx.messageClient.respond(`Failed to close ${issueUrl} ${error}`);
            return { code: 1 }
        })

        const removeLabelPromise = closePromise.then((handlerResult) => {
            const labelResource = encodeURI(`${issueUrl}/labels/${inProgressLabelName}`);
            return axios.delete(labelResource,
                { headers: { Authorization: `token ${githubToken}` } }
            ).then((response) => {
                logger.info(`Successfully removed a label from ${issueUrl}`)
                return handlerResult;
            }).catch(error => {
                ctx.messageClient.respond(`Failed to remove ${inProgressLabelName} label from ${issueUrl} ${error}`)
                return { code: 1 };
            });
        })

        return removeLabelPromise
    }
}

