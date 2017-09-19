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

@EventHandler("Notify channel on push", GraphQL.subscriptionFromFile("graphql/push"))
@Tags("push", "notification")
export class NotifyOnPush implements HandleEvent<PushWithRepoSubscription> {

    public handle(e: EventFired<PushWithRepoSubscription>, ctx: HandlerContext): Promise<HandlerResult> {
        logger.info(`Incoming event is %s`, JSON.stringify(e.data, null, 2));

        return Promise.all(e.data.Push.map(p =>
            ctx.messageClient.addressChannels(`Got a push with sha \`${p.after.sha}\``,
                p.repo.channels.map(c => c.name))))
            .then(() => {
                return Promise.resolve({ code: 0 });
            });
    }
}
