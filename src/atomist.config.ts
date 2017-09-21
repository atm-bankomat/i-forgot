import { Configuration } from "@atomist/automation-client/configuration";
import { NotifyOnPush } from "./events/NotifyOnPush";
import { ActionBoard, CommenceWork, ActionBoardUpdate, PostponeWork } from "./action-board/ActionBoard";

import * as cfenv from "cfenv";
import { UpdateActionBoardsOnIssue } from "./action-board/UpdateActionBoardsOnIssue";
import { Unassign } from "./action-board/Unassign";
import { CloseIssue } from "./action-board/Complete";

const pj = require("../../package.json");

const appEnv = cfenv.getAppEnv();
const credService = appEnv.getServiceCreds("github-token");

const token = credService ? credService.token : process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: "action-board",
    version: "0.2.0",
    teamId: "T6MFSUPDL",
    commands: [
        () => new ActionBoard(),
        () => new ActionBoardUpdate(),
        () => new CommenceWork(),
        () => new PostponeWork(),
        () => new Unassign(),
        () => new CloseIssue(),
    ],
    events: [
        () => new UpdateActionBoardsOnIssue(),
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
