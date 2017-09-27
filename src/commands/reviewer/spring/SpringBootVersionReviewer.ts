import { CommandHandler, Parameter, Tags } from "@atomist/automation-client/decorators";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ReviewerCommandSupport } from "@atomist/automation-client/operations/review/ReviewerCommandSupport";
import { clean, ProjectReview, ReviewResult } from "@atomist/automation-client/operations/review/ReviewResult";
import { findMatches } from "@atomist/automation-client/project/util/parseUtils";
import { ParentStanzaGrammar } from "../../../grammars/mavenGrammars";
import { SpringBootStarter } from "../../editor/spring/springConstants";

@CommandHandler("Reviewer that flags old versions of Spring Boot", "review spring boot version")
@Tags("atomist", "spring")
export class SpringBootVersionReviewer
    extends ReviewerCommandSupport<ReviewResult<SpringBootProjectReview>, SpringBootProjectReview> {

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

    public projectReviewer(): ProjectReviewer<SpringBootProjectReview> {
        const desiredVersion = this.desiredBootVersion;
        return (id, p, context) => {
            return findMatches(p, "pom.xml", ParentStanzaGrammar)
                .then(matches => {
                    if (matches.length > 0 && matches[0].gav.artifact === SpringBootStarter) {
                        const version = matches[0].gav.version;
                        const outDated = version !== this.desiredBootVersion;
                        if (outDated) {
                            return Promise.resolve({
                                repoId: id,
                                comments: [
                                    {
                                        severity: "warn",
                                        comment: `Old version of Spring Boot: [${version}] - ` +
                                                `should have been [${this.desiredBootVersion}]`,
                                    },
                                ],
                                version,
                                desiredVersion,
                            } as SpringBootProjectReview);
                        }
                    }
                    return Promise.resolve(clean(id));
                });
        };
    }

}

export interface SpringBootProjectReview extends ProjectReview {

    version?: string;

    desiredVersion?: string;
}
