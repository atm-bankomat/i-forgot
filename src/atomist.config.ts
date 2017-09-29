import { Configuration } from "@atomist/automation-client/configuration";
import { guid } from "@atomist/automation-client/internal/util/string";
import { ActionBoard, CommenceWork, ActionBoardUpdate, PostponeWork } from "./action-board/ActionBoard";

import { UpdateActionBoardsOnIssue } from "./action-board/UpdateActionBoardsOnIssue";
import { Unassign } from "./action-board/Unassign";
import { CloseIssue } from "./action-board/Complete";
import { BuildLog } from "./lint-fix/BuildLog";
import { NewAutomation } from "./commands/generator/NewAutomation";
import { HelloIngestor } from "./events/HelloIngestor";

const pj = require("../../package.json");

const token = process.env["GITHUB_TOKEN"];

export const configuration: Configuration = {
    name: "action-board",
    version: "0.2.4",
    teamId: "T6MFSUPDL",
    commands: [
        // build
        // () => new BuildLog(),
        () => new ActionBoard(),
        () => new ActionBoardUpdate(),
        () => new CommenceWork(),
        () => new PostponeWork(),
        () => new CloseIssue(),
        () => new Unassign(),
        () => new NewAutomation(),
    ],
    events: [
        () => new UpdateActionBoardsOnIssue(),
    ],
    ingestors: [
        () => new HelloIngestor(),
    ],
    token,
    http: {
        enabled: true,
        auth: {
            basic: {
                enabled: false,
            },
            bearer: {
                enabled: false,
            },
        },
    },
};
