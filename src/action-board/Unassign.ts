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

@CommandHandler("Unassign me from this issue", "I'm not going to do this one")
@Tags("action-board")
export class Unassign implements HandleCommand {
    public static Name = "Unassign";

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
            `${slack.user(slackUser)} decided this issue is not for them: ` + this.issueUrl,
            teamStream);

        const assigneesResource = encodeURI(`${issueUrl}/assignees`);

        return axios({
            method: 'delete',
            url: assigneesResource,
            data: {
                "assignees": [githubName],
            },
            headers: { Authorization: `token ${githubToken}` }
        }).then((response) => {
            logger.info(`Successfully unassigned ${githubName} from ${issueUrl}`)
            return Promise.resolve({ code: 0 })
        }).catch(error => {
            ctx.messageClient.respond(`Failed to unassign ${githubName} from ${issueUrl} ${error}`)
            return Promise.resolve({ code: 1 })
        })
    }
}

