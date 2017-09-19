import { Configuration } from "@atomist/automation-client/configuration";

import { HelloWorld } from "./commands/simple/HelloWorld";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { NotifyOnPush } from "./events/NotifyOnPush";

const pj = require("../../package.json");

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamId: "T1L0VDKJP",
    commands: [
        () => new HelloWorld(),
    ],
    events: [
        () => new CommentOnIssue(),
        () => new NotifyOnPush(),
    ],
    token: process.env.GITHUB_TOKEN,
};
