import { CommandHandler, Parameter, Tags } from "@atomist/automation-client/decorators";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { ParentStanzaGrammar } from "../../grammars/MavenGrammars";
import { EditResult, ProjectEditor } from "@atomist/automation-client/operations/edit/ProjectEditor";
import { EditorCommandSupport } from "@atomist/automation-client/operations/edit/EditorSupport";
import { doWithAtMostOneMatch } from "@atomist/automation-client/project/util/parseUtils";
import { logger } from "@atomist/automation-client/internal/util/logger";

/**
 * Upgrade the version of Spring Boot projects to a desired version
 */
@CommandHandler("Reviewer that flags old versions of Spring Boot", "review spring boot version")
@Tags("atomist", "spring")
export class SpringBootVersionUpgrade extends EditorCommandSupport {

    @Parameter({
        displayName: "Desired Spring Boot version",
        description: "The desired Spring Boot version across these repos",
        pattern: /^.+$/,
        validInput: "Semantic version",
        required: false,
    })
    public desiredBootVersion: string = "1.5.6.RELEASE";

    constructor() {
        // Check with an API call if the repo has a POM,
        // to save unnecessary cloning
        super(r => this.local ? Promise.resolve(true) : hasFile(this.githubToken, r.owner, r.repo, "pom.xml"));
    }

    public projectEditor(): ProjectEditor<EditResult> {
        const desiredVersion = this.desiredBootVersion;
        let edited = false;
        return (id, p) => {
            return doWithAtMostOneMatch(p, "pom.xml",
                ParentStanzaGrammar, m => {
                    if (m.version.value !== desiredVersion) {
                        logger.info(`Updating Spring Boot version from [%s] to [%s]`,
                            m.version.value, desiredVersion);
                        m.version.value = desiredVersion;
                        edited = true;
                    }
                })
                .run()
                .then(_ => {
                    return {
                        edited,
                    }
                });
        }
    }

}
