import * as assert from "power-assert";

import * as appRoot from "app-root-path";

import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import { atomistConfigTeamNameGrammar, NewAutomation } from "../../../src/commands/generator/NewAutomation";

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
            { path: "package.json", content: praw.findFileSync("package.json").getContentSync() },
            { path: "src/atomist.config.ts", content: praw.findFileSync("src/atomist.config.ts").getContentSync() },
        );
        const seed = new NewAutomation();
        seed.targetRepo = "theTargetRepo";
        seed.team = "T1000";
        seed.manipulateAndFlush(p)
            .then(pr => {
                const newPackageJson = JSON.parse(pr.findFileSync("package.json").getContentSync());
                assert(newPackageJson.name === seed.targetRepo,
                    `Was [${newPackageJson.name}] expected [${seed.targetRepo}]`);

                // teamId: "T1L0VDKJP",
                const newAtomistConfig = pr.findFileSync("src/atomist.config.ts").getContentSync();
                assert(newAtomistConfig.includes(seed.team), "Actual content was\n" + newAtomistConfig);
                done();
            }).catch(done);
    });

});

describe("atomist.config.ts microgrammar", () => {

    it("should not match irrelevant gibberish", () => {
        const thisIsALoadOfNonsense = "and then the clock struck 2";
        assert(atomistConfigTeamNameGrammar.findMatches(thisIsALoadOfNonsense).length === 0);
    });

    it("should match actual content", () => {
        const matches = atomistConfigTeamNameGrammar.findMatches(actualAtomistConfigTsFragment);
        assert(matches.length === 1);
        assert(matches[0].name === "T1L0VDKJP");
    });

});

const actualAtomistConfigTsFragment = `
export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamId: "T1L0VDKJP",
    commands: [
        () => new HelloWorld(),
    ],
    }`;
