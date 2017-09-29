import * as appRoot from "app-root-path";
import { Configuration } from "@atomist/automation-client/configuration";
import { SpringBootModernizer } from "./commands/editor/spring/SpringBootModernizer";
import { SpringBootVersionUpgrade } from "./commands/editor/spring/SpringBootVersionUpgrade";
import { NewAutomation } from "./commands/generator/NewAutomation";
import { VersionMapper } from "./commands/reviewer/maven/VersionMapper";
import { VersionSpreadReviewer } from "./commands/reviewer/maven/VersionSpreadReviewer";
import { SpringBootVersionReviewer } from "./commands/reviewer/spring/SpringBootVersionReviewer";
import { HelloWorld } from "./commands/simple/HelloWorld";
import { CommentOnIssue } from "./events/CommentOnIssue";
import { HelloIngestor } from "./events/HelloIngestor";
import { NotifyOnPush } from "./events/NotifyOnPush";

const pj = require(`${appRoot}//package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name ,
    version: pj.version,
    teamId: "T29E48P34", // <-- run @atomist pwd in your slack team to obtain the team id
    commands: [
        () => new HelloWorld(),
        () => new SpringBootVersionReviewer(),
        () => new VersionSpreadReviewer(),
        () => new VersionMapper(),
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
