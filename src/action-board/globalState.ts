import { logger } from "@atomist/automation-client/internal/util/logger";

const fs = require("fs");

export interface ActionBoardActivity {
    identifier: string
}

export interface ActionBoardSpecifier {
    wazzupMessageId: string;
    channelId: string;
    channelName: string;
    githubName: string;
    collapse: boolean;
    ts: number;
    activities?: ActionBoardActivity[]
}

export function affectedBy(actionBoard: ActionBoardSpecifier, issue: { apiUrl: string, assignees: { login: string }[] }): boolean {
    if (!actionBoard.activities) {
        return true;
    }
    if (issue.assignees.some(a => a.login === actionBoard.githubName)) {
        return true;
    }
    if (actionBoard.activities.some(act => act.identifier === issue.apiUrl)) {
        return true;
    }
    logger.info(`Skipping ${actionBoard.wazzupMessageId} with activities ${actionBoard.activities.map(a => a.identifier).join(" ")} because it wasn't affected by ${JSON.stringify(issue)}`);
    return false;
}

export interface TrackActionBoards {
    add(one: ActionBoardSpecifier): void;
    update(one: ActionBoardSpecifier): void;
    fetchAll(): ActionBoardSpecifier[];
}

class ActionBoardTracker implements TrackActionBoards {

    private CacheFile = "actionBoardsCache.json"
    private writePromise = Promise.resolve(null);
    private cache: {} = {}; // channelName -> ActionBoardSpecifier

    constructor() {
        try {
            const content = fs.readFileSync(this.CacheFile);
            this.cache = JSON.parse(content) || {};
            logger.info("Read from action board cache: " + JSON.stringify(this.cache));
        } catch {
            (e) => {
                this.cache = {};
                logger.error(`FYI, unable to read ${this.CacheFile}: ` + JSON.stringify(e));
            }
        };
    }

    private writeCache(content: {}) {
        const filename = this.CacheFile;
        this.writePromise =
            this.writePromise.
                then(a => fs.writeFile(filename, JSON.stringify(content))).
                catch(e => logger.error(`FYI, unable to write ${this.CacheFile}`))
    }

    add(one: ActionBoardSpecifier): void {
        this.cache[one.channelName] = one;
        this.writeCache(this.cache);
    }
    update(one: ActionBoardSpecifier): void {
        if (this.cache[one.channelName].wazzupMessageId === one.wazzupMessageId) {
            this.cache[one.channelName] = one;
            this.writeCache(this.cache);
        } else {
            logger.info(`Not storing ${one.wazzupMessageId} because it is not current for the channel`)
        }
    }
    fetchAll(): ActionBoardSpecifier[] {
        return Object.values(this.cache) as ActionBoardSpecifier[];
    }

}

export const globalActionBoardTracker: TrackActionBoards = new ActionBoardTracker();