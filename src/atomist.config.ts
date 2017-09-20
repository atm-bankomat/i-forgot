import { Configuration } from "@atomist/automation-client/configuration";
import * as cfenv from "cfenv";

import { HelloWorld } from "./commands/simple/HelloWorld";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { NotifyOnPush } from "./events/NotifyOnPush";

const pj = require("../../package.json");

const appEnv = cfenv.getAppEnv();
const credService = appEnv.getServiceCreds("github-token");

const token = credService ? credService.token : process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamId: "T74GV0HDK",
    commands: [
        () => new HelloWorld(),
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
