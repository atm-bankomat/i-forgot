import * as assert from "power-assert";

import * as appRoot from "app-root-path";

import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";

import { NewAutomation } from "../../../src/commands/generator/NewAutomation";

describe("NewAutomation", () => {

    it("ignores irrelevant content without failing", done => {
        const files = [
            new InMemoryFile("a", "a"),
            new InMemoryFile("b", "a"),
            new InMemoryFile("c/d/e.txt", "a"),
        ];
        const project = InMemoryProject.of(...files);
        const seed = new NewAutomation();
        seed.manipulateAndFlush(project)
            .then(_ => {
                assert(project.fileCount === files.length);
                done();
            }).catch(done);
    });

    it("edits this project", done => {
        const praw = new NodeFsLocalProject("test", appRoot);
        const p = InMemoryProject.of(
            {path: "package.json", content: praw.findFileSync("package.json").getContentSync()},
            {path: "src/atomist.config.ts", content: praw.findFileSync("src/atomist.config.ts").getContentSync()},
        );
        const seed = new NewAutomation();
        seed.targetRepo = "theTargetRepo";
        seed.team = "T1000";
        seed.manipulateAndFlush(p)
            .then(p => {
                //assert(p.fileCount === 2);
                const newPackageJson = JSON.parse(p.findFileSync("package.json").getContentSync());
                assert(newPackageJson.name === seed.targetRepo,
                    `Was [${newPackageJson.name}] expected [${seed.targetRepo}]`);
                done();
            }).catch(done);
    });

});
