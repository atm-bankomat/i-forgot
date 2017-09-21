import { Parameter } from "@atomist/automation-client/decorators";
import { UniversalSeed } from "@atomist/automation-client/operations/generate/UniversalSeed";
import { ProjectNonBlocking } from "../../../../automation-client-ts/build/src/project/Project";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";

import { doWithMatches } from "@atomist/automation-client/project/util/parseUtils";
import { Project } from "@atomist/automation-client/project/Project";

/**
 * Create a new automation from this repo
 */
export class NewAutomation extends UniversalSeed {

    @Parameter({
        displayName: "Slack Team ID",
        description: "team identifier for Slack team associated with this automation",
        pattern: /^T[0-9A-Z]+$/,
        validInput: "Slack team identifier of form T0123WXYZ",
        required: true,
    })
    public team: string;

    public manipulateAndFlush(project: Project): Promise<Project> {
        return this.editPackageJson(project)
            .then(_ => project.flush());
        //this.editAtomistConfigTs(project);
    }

    protected editPackageJson(p: ProjectNonBlocking): Promise<any> {
        return doWithMatches<{ name: string }>(p, "package.json", packageJsonNameGrammar, pkgJson => {
            // There will be only one match
            console.log("Matched " + pkgJson.file.path + " with " + pkgJson.matches.map(m => "[" + m.$matched + "]").join(","));
            pkgJson.makeUpdatable();
            console.log("Existing name is " + pkgJson.matches[0].name);
            pkgJson.matches[0].name = this.targetRepo;
            console.log("Updated to " + pkgJson.matches[0].name);
        }).run();
    }

    protected editAtomistConfigTs(p: ProjectNonBlocking) {
        return doWithMatches<{ name: string }>(p, "package.json", packageJsonNameGrammar, pkgJson => {
            // There will be only one match
            console.log("Matched " + pkgJson.file.path + " with " + pkgJson.matches.map(m => "[" + m.$matched + "]").join(","));
            pkgJson.makeUpdatable();
            console.log("Existing name is " + pkgJson.matches[0].name);
            pkgJson.matches[0].name = this.targetRepo;
            console.log("Updated to " + pkgJson.matches[0].name);
        }).run();
    }
}

const packageJsonNameGrammar = Microgrammar.fromDefinitions<{ name: string }>({
    _n: '"name"',
    _c: ":",
    _lq: '"',
    name: /@[^"]+/,
    _rq: '"',
});

const atomistConfigTeamNameGrammar = Microgrammar.fromString<{ name: string }>(
    'teamId: "${name}"',
    {
        name: /^T[0-9A-Z]+$/,
    },
);