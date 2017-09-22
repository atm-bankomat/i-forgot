import { Parameter } from "@atomist/automation-client/decorators";
import { UniversalSeed } from "@atomist/automation-client/operations/generate/UniversalSeed";
import { ProjectNonBlocking } from "../../../../automation-client-ts/build/src/project/Project";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";

import { doWithFileMatches } from "@atomist/automation-client/project/util/parseUtils";
import { Project } from "@atomist/automation-client/project/Project";

/**
 * Generator command to create a new node automation client repo
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

    constructor() {
        super();
        this.sourceRepo = "automation-client-samples-ts";
    }

    public manipulate(project: Project) {
        this.editPackageJson(project);
        this.editAtomistConfigTs(project);
    }

    protected editPackageJson(p: ProjectNonBlocking) {
        doWithFileMatches<{ name: string }>(p, "package.json", packageJsonNameGrammar, pkgJson => {
            // There will be only one match
            pkgJson.matches[0].name = this.targetRepo;
        }).defer();
    }

    protected editAtomistConfigTs(p: ProjectNonBlocking) {
        doWithFileMatches<{ name: string }>(p, "src/atomist.config.ts", atomistConfigTeamNameGrammar, atomistConfig => {
            // There will be only one match
            atomistConfig.matches[0].name = this.team;
        }).defer();
    }
}

// "name": "@atomist/automation-client-samples",
const packageJsonNameGrammar = Microgrammar.fromString<{ name: string }>(
    '"name": "${name}"', {
    name: /[^"]+/,
});

// teamId: "T1L0VDKJP",
export const atomistConfigTeamNameGrammar = Microgrammar.fromString<{ name: string }>(
    'teamId: "${name}"',
    {
        name: /T[0-9A-Z]+/,
    },
);