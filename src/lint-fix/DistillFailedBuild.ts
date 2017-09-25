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
    subscription)
@Tags("travis")
export class FailedBuildLog implements HandleEvent<any> {

    public handle(e: EventFired<any>, ctx: HandlerContext): Promise<any> {
        logger.info(`Incoming event is %s`, JSON.stringify(e.data, null, 2));

        const buildData = e.data;
        const author: { screenName: string } | string = // string means error
            e.data.commit ? "No commit on build" :
                e.data.commit[0].author ? "No author on commit" :
                    e.data.commit[0].author.person ? "No person on author, GH login " + e.data.commit[0].author :
                        e.data.commit[0].author.person.chatId ? "No chat ID on person " + e.data.commit[0].author :
                            e.data.commit[0].author.person.chatId.screenName ?
                                "No screen name on chatId for person " + + e.data.commit[0].author :
                                { screenName: e.data.commit[0].author.person.chatId.screenName }

        if (typeof author === "string") {
            ctx.messageClient.addressChannels(
                `There was a failed build here: ${buildData.buildUrl} but I couldn't figure out whose it is. ${author}`,
                teamStream)
            return Promise.resolve({ code: 1 });
        }

        ctx.messageClient.addressUsers("I saw your failed build at " + buildData.buildUrl,
            author.screenName)
        return Promise.resolve({ code: 0 });
    }
}
