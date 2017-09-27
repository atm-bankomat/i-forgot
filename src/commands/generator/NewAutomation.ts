import { CommandHandler, MappedParameter } from "@atomist/automation-client/decorators";
import { UniversalSeed } from "@atomist/automation-client/operations/generate/UniversalSeed";
import { Project, ProjectNonBlocking } from "@atomist/automation-client/project/Project";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";

import { MappedParameters } from "@atomist/automation-client/Handlers";
import { doWithAtMostOneMatch } from "@atomist/automation-client/project/util/parseUtils";

/**
 * Generator command to create a new node automation client repo
 */
@CommandHandler("Create a new automation repo", "new automation")
export class NewAutomation extends UniversalSeed {

    @MappedParameter(MappedParameters.SLACK_TEAM)
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
        doWithAtMostOneMatch<{ name: string }>(p, "package.json", packageJsonNameGrammar, m => {
            m.name = this.targetRepo;
        }).defer();
    }

    protected editAtomistConfigTs(p: ProjectNonBlocking) {
        doWithAtMostOneMatch<{ name: string }>(p, "src/atomist.config.ts", atomistConfigTeamNameGrammar, m => {
            m.name = this.team;
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
