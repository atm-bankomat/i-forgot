import { Configuration } from "@atomist/automation-client/configuration";
import { guid } from "@atomist/automation-client/internal/util/string";

import { SpringBootModernizer } from "./commands/editor/spring/SpringBootModernizer";
import { SpringBootVersionUpgrade } from "./commands/editor/spring/SpringBootVersionUpgrade";
import { NewAutomation } from "./commands/generator/NewAutomation";
import { SpringBootVersionReviewer } from "./commands/reviewer/spring/SpringBootVersionReviewer";
import { VersionSpreadReviewer } from "./commands/reviewer/VersionSpreadReviewer";
import { HelloWorld } from "./commands/simple/HelloWorld";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { HelloIngestor } from "./events/HelloIngestor";
import { NotifyOnPush } from "./events/NotifyOnPush";

// const pj = require("./package.json");

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: `aws-lambda-test-${guid()}` ,
    version: `0.1.0`,
    teamId: "T1L0VDKJP",
    commands: [
        () => new HelloWorld(),
        () => new SpringBootVersionReviewer(),
        () => new VersionSpreadReviewer(),
        () => new NewAutomation(),
        () => new SpringBootModernizer(),
        () => new SpringBootVersionUpgrade(),
    ],
    events: [
        () => new CommentOnIssue(),
        () => new NotifyOnPush(),
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
