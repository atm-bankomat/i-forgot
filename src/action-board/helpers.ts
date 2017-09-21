import { HandlerContext } from '@atomist/automation-client/Handlers';
import { logger } from "@atomist/automation-client/internal/util/logger";
import { GitHubIssueResult } from './GitHubApiTypes';

export const teamStream = "#team-stream";
export const inProgressLabelName = "in-progress";

const reposLinkedToThisChannel = `query ($teamId: ID!, $channelId: ID!) {
  ChatTeam(id: $teamId) {
    channels(id: $channelId) {
      links {
        repo {
          name 
          owner
        }
      }
    }
  }
}`;

export interface Repository {
    name: string,
    owner: string
}

export function findLinkedRepositories(
    ctx: HandlerContext,
    channelId: string): Promise<Repository[]> {
    return ctx.graphClient.executeQuery<any, any>(reposLinkedToThisChannel,
        { teamId: ctx.teamId, channelId: channelId })
        .then(result => {
            // logger.info("repos linked to query result: " + JSON.stringify(result, null, 2));
            return result.ChatTeam[0].channels[0].links.map(link => link.repo as Repository);
        }).catch(error => {
            logger.error(`failure running query ${reposLinkedToThisChannel}: ${error}`)
            return [];
        });
}


export function isWorkday() {
    // I'm not trying -that- hard.
    return [1, 2, 3, 4, 5].some(workday => workday === new Date().getDay());
}

const repoUrlRegex = /.*repos\/(.*)\/(.*)/;

export function repositoryFromIssue(issue: GitHubIssueResult): Repository {
    const m = issue.repository_url.match(repoUrlRegex);
    if (!m) {
        return { name: `I could not parse the repoUrl of ${issue.repository_url}`, owner: '' };
    }
    return { name: m[2], owner: m[1] };
}

export function toEmoji(s: string): string {
    let validEmojiName = s.replace(/:/g, "-").replace(/ /g, "-").toLowerCase();
    return `:${validEmojiName}:`;
}

export function normalizeTimestamp(timestamp: string): number {
    let pd = new Date().getTime();
    try {
        const date = Date.parse(timestamp);
        if (!isNaN(date)) {
            pd = date;
        }
    } catch (e) {
        // Ignore
    }
    return Math.floor(pd / 1000);
}


export function timeSince(dateString: string) {
    if (dateString == null) {
        return "never";
    }
    const then = Date.parse(dateString);
    const now = new Date().getTime();
    const secondsPast = (now - then) / 1000;
    if (secondsPast < 60) {
        return `${Math.round(secondsPast)}s ago`;
    }
    if (secondsPast < 3600) {
        return `${Math.round(secondsPast / 60)}m ago`;
    }
    if (secondsPast <= 86400) {
        return `${Math.round(secondsPast / 3600)}h ago`;
    }
    if (secondsPast <= (86400 * 30)) {
        return `${Math.round(secondsPast / 86400)}d ago`;
    } else {
        return dateString.substr(0, 10);
    }
}
