import { Configuration } from "@atomist/automation-client/configuration";
import { guid } from "@atomist/automation-client/internal/util/string";
import { ActionBoard, CommenceWork, ActionBoardUpdate, PostponeWork } from "./action-board/ActionBoard";

import { UpdateActionBoardsOnIssue } from "./action-board/UpdateActionBoardsOnIssue";
import { Unassign } from "./action-board/Unassign";
import { CloseIssue } from "./action-board/Complete";
import { BuildLog } from "./lint-fix/BuildLog";
import { FailedBuildLog } from "./lint-fix/DistillFailedBuild";
import { BuildOnTravis } from "./lint-fix/BuildOnTravis";

const pj = require("../../package.json");

const token = process.env["GITHUB_TOKEN"];

export const configuration: Configuration = {
    name: "automate-lint-fix",
    version: "0.2.3",
    teamId: "T6MFSUPDL",
    commands: [
        // () => new ActionBoard(),
        // () => new ActionBoardUpdate(),
        // () => new CommenceWork(),
        // () => new PostponeWork(),
        // () => new Unassign(),
        // () => new CloseIssue(),
        // build
        () => new BuildLog(),
        () => new BuildOnTravis(),
    ],
    events: [
        //  () => new UpdateActionBoardsOnIssue(),
        () => new FailedBuildLog()
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
