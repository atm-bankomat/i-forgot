import { GitHubUser, GitHubIssueLabel, GitHubIssueResult } from './../action-board/GitHubApiTypes';
import {
  EventFired,
  EventHandler,
  HandleEvent,
  HandlerContext,
  HandlerResult,
  Secret,
  Secrets,
  Tags,
} from "@atomist/automation-client/Handlers";
import axios from "axios";
import { globalActionBoardTracker } from '../action-board/globalState';
import { doWazzup } from '../action-board/ActionBoard';
import * as slack from "@atomist/slack-messages/SlackMessages";

/*
this is the graphql that would match the GitHub rest API:
query GitHubIssueResult {
  Issue {
    url
    number
    title
    repository_url
    assignees {
      login
      avatar_url
    }
    user {
      login
      avatar_url
    }
    state
    created_at
    labels {
      name
    }
    updated_at
  }
}
*/

@EventHandler("Notify channel on new issue and add comment to issue", `subscription CommentOnIssue
{
Issue {
    repo {
      name
      org {
        owner
        provider  {
          apiUrl
          url
        }
      }
    }
    action
    number
    title
    assignees {
      login
    }
    openedBy {
      login
    }
    state
    createdAt
    labels {
      name
    }
    updatedAt
  }
}`)
@Tags("issue", "comment")
export class UpdateActionBoardsOnIssue implements HandleEvent<any> {

  @Secret(Secrets.ORG_TOKEN)
  public githubToken: string;

  public handle(e: EventFired<any>, ctx: HandlerContext): Promise<HandlerResult> {
    const issue = e.data.Issue[0];
    const githubToken = this.githubToken;
    const lastAction = issue.action;

    const htmlUrlBase = issue.repo.org.provider ? issue.repo.org.provider.url : "https://github.com/"
    const apiUrlBase = issue.repo.org.provider ? issue.repo.org.provider.apiUrl : "https://api.github.com/"

    //const htmlUrl = `${htmlUrlBase}/${issue.repo.org.owner}/${issue.repo.name}/issues/${issue.name}`
    // const linkToIssue = slack.url(htmlUrl, `${issue.repo.org.owner}/${issue.repo.name}#${issue.name}`);

    // const myIssue: GitHubIssueResult = {
    //     ...issue,
    //     html_url: htmlUrl,
    //     url: `${apiUrlBase}/repos/${issue.repo.org.owner}/${issue.repo.name}/issues/${issue.name}`,
    //     // todo: just use repository
    //     repository_url: `${apiUrlBase}/repos/${issue.repo.org.owner}/${issue.repo.name}`,
    //     user: issue.openedBy,
    //     updated_at: issue.updatedAt,
    //     created_at: issue.createdAt,
    // }

    const boardsToUpdate = globalActionBoardTracker.fetchAll();

    const promises = boardsToUpdate.map(
      actionBoard => {
        return doWazzup(ctx,
          { ...actionBoard, ts: new Date().getTime() },
          githubToken, false,
          `update to ${issue.repo.org.owner}/${issue.repo.name}#${issue.name}, ${lastAction}`)
      });
    const things = Promise.all(promises)

    return things.
      then(r => ctx.messageClient.addressUsers(`Updated ${boardsToUpdate.length} messages:\n${boardsToUpdate.map(b => b.wazzupMessageId).join("\n")}`, "jessitron")).
      then(r => Promise.resolve({ code: 0 }))
  }
}
