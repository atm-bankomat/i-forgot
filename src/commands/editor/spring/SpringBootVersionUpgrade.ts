import { CommandHandler, Parameter, Tags } from "@atomist/automation-client/decorators";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { EditorCommandSupport } from "@atomist/automation-client/operations/edit/EditorCommandSupport";
import { EditResult, ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { setSpringBootVersionEditor } from "./setSpringBootVersionEditor";

/**
 * Upgrade the version of Spring Boot projects to a desired version
 */
@CommandHandler("Upgrade versions of Spring Boot across an org", "upgrade spring boot version")
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
        return setSpringBootVersionEditor(this.desiredBootVersion);
    }

}
