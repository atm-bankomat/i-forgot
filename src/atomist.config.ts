import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";

import { NewAutomation } from "./commands/generator/NewAutomation";
import { HelloIngestor } from "./events/HelloIngestor";
import { StartDownstreamTests } from "./cascading-tests/StartDownstreamTests";
import { SetUpstreamStatusOnBuildCompletion } from "./cascading-tests/SetUpstreamStatusOnBuildCompletion";
// import { DistillBuildLog, FailedBuildLog } from "./lint-fix/DistillFailedBuild";

const pj = require(`${appRoot}//package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: "action-board",
    version: "0.2.4",
    teamId: "T7BPVSAR3",
    commands: [
        // build
        // () => new BuildLog(),
        // () => new BuildOnTravis(),
        // () => new DistillBuildLog(),
        () => new NewAutomation(),
    ],
    events: [
        //  () => new UpdateActionBoardsOnIssue(),
        // () => new FailedBuildLog(),
        // () => new LintEveryBranch(),
        () => new SetUpstreamStatusOnBuildCompletion(),
        () => new StartDownstreamTests(),
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
