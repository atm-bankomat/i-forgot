import { Configuration } from "@atomist/automation-client/configuration";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { NotifyOnPush } from "./events/NotifyOnPush";
import { ActionBoard, CommenceWork, ActionBoardUpdate, PostponeWork } from "./action-board/ActionBoard";

import * as cfenv from "cfenv";

const pj = require("../../package.json");

const appEnv = cfenv.getAppEnv();
const credService = appEnv.getServiceCreds("github-token");

const token = credService ? credService.token : process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: "jessitrons-unique-name-2",
    version: "0.1.1",
    teamId: "T6MFSUPDL",
    commands: [
        () => new ActionBoard(),
        () => new ActionBoardUpdate(),
        () => new CommenceWork(),
        () => new PostponeWork(),
    ],
    events: [
        () => new CommentOnIssue(),
        () => new NotifyOnPush(),
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
