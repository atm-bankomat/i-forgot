import { Configuration } from "@atomist/automation-client/configuration";
import { guid } from "@atomist/automation-client/internal/util/string";

import { HelloWorld } from "./commands/simple/HelloWorld";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { NotifyOnPush } from "./events/NotifyOnPush";

// const pj = require("./package.json");

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: `aws-lambda-test-${guid()}` ,
    version: `0.1.0`,
    teamId: "T1L0VDKJP",
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
