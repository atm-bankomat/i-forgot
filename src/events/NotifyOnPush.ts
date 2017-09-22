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

const Query = `
subscription PushWithRepo {
    Push {
     builds {
       buildUrl
       name
       provider
       commit {
         sha
       }
     }
     before {
       sha
     }
     after {
       sha
       statuses {
         context
         description
         targetUrl
       }
     }
     repo {
       owner
       name
       channels {
         name
       }
       labels {
         name
       }
       org {
         provider {
           url
           apiUrl
           gitUrl
         }
       }
     }
     commits {
       sha
       resolves {
         number
         name
         title
       }
       impact {
         data
         url
       }
       apps {
         state
         host
         domain
         data
       }
       tags {
         name
         release {
           name
         }
         containers {
           pods {
             host
             state
             name
           }
         }
       }
       author {
         login
         person {
           chatId {
             screenName
           }
         }
       }
     }
    }
  }`;

@EventHandler("Notify channel on push", Query)
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
