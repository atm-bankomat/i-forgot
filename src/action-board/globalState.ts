import { logger } from "@atomist/automation-client/internal/util/Logger";

const fs = require("fs");

export interface ActionBoardSpecifier {
    wazzupMessageId: string;
    channelId: string;
    githubName: string;
    collapse: boolean;
}

export interface TrackActionBoards {
    add(one: ActionBoardSpecifier): void;
    update(one: ActionBoardSpecifier): void;
    fetchAll(): ActionBoardSpecifier[];
}

class ActionBoardTracker implements TrackActionBoards {

    private CacheFile = "actionBoardsCache.json"
    private writePromise = Promise.resolve(null);
    private cache: {} = {};

    constructor() {
        try {
            console.log(`****_________TRON: reading in the cache`);

            const content = fs.readFileSync(this.CacheFile);
            console.log(`****_________TRON: did the cache read`)
            this.cache = JSON.parse(content) || {};

            logger.info("Read from action board cache: " + JSON.stringify(this.cache));
        } catch {
            (e) => {
                this.cache = {};
                console.log(`****_________TRON:did not read the cache`)

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
        this.cache[one.wazzupMessageId] = one;
        this.writeCache(this.cache);
    }
    update(one: ActionBoardSpecifier): void {
        this.cache[one.wazzupMessageId] = one;
        this.writeCache(this.cache);
    }
    fetchAll(): ActionBoardSpecifier[] {
        return Object.values(this.cache) as ActionBoardSpecifier[];
    }

}

export const globalActionBoardTracker: TrackActionBoards = new ActionBoardTracker();