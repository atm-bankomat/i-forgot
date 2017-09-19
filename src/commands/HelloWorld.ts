import { MappedParameter } from "@atomist/automation-client/decorators";
import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult, MappedParameters,
    Parameter,
    Tags,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/Logger";
import { PersonQuery, PersonQueryVariables } from "../schema";

@CommandHandler("Sends a hello back to the invoking user/channel", "hello world")
@Tags("hello")
export class HelloWorld implements HandleCommand {

    @Parameter({ pattern: /^.*$/ })
    public name: string;

    @MappedParameter(MappedParameters.SLACK_USER_NAME)
    public slackUser: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        logger.info(`Incoming parameter was ${this.name}`);

        return ctx.graphClient.executeFile<PersonQuery, PersonQueryVariables>("person",
            { teamId: ctx.teamId, slackUser: this.slackUser })
            .then(result => {
                console.log(JSON.stringify(result));
                return result.ChatTeam[0].members[0].person;
            })
            .then(person => {
                return ctx.messageClient.respond(`Hello ${this.name} from ${person.forename} ${person.surname}`);
            })
            .then(() => {
                return { code: 0 };
            });
    }
}
