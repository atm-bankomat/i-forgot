import { Configuration } from "@atomist/automation-client/configuration";
import { guid } from "@atomist/automation-client/internal/util/string";
import { ActionBoard, ActionBoardUpdate, CommenceWork, PostponeWork } from "./action-board/ActionBoard";
import * as appRoot from "app-root-path";

import { CloseIssue } from "./action-board/Complete";
import { UpdateActionBoardsOnIssue } from "./action-board/UpdateActionBoardsOnIssue";
import { Unassign } from "./action-board/Unassign";
import { NewAutomation } from "./commands/generator/NewAutomation";
import { HelloIngestor } from "./events/HelloIngestor";
import { BuildLog } from "./lint-fix/BuildLog";
import { BuildOnTravis } from "./lint-fix/BuildOnTravis";
import { DistillBuildLog, FailedBuildLog } from "./lint-fix/DistillFailedBuild";
import { LintEveryBranch } from "./lint-fix/LintEveryBranch";

const pj = require(`${appRoot}//package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: "failed-build-logs",
    version: "0.2.4",
    teamId: "T7BPVSAR3",
    commands: [
        // build
        () => new BuildLog(),
        () => new BuildOnTravis(),
        () => new DistillBuildLog(),
    ],
    events: [
        () => new FailedBuildLog(),
    ],
    ingestors: [
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
