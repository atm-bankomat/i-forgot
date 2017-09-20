
import { CommandHandler, Parameter, Tags } from "@atomist/automation-client/decorators";
import { ReviewerSupport } from "@atomist/automation-client/operations/review/ReviewerSupport";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/ProjectReviewer";

@CommandHandler("Reviewer that flags old versions of Spring Boot", "review spring boot version")
@Tags("atomist", "spring")
export class SpringBootVersionReviewer extends ReviewerSupport<ProjectReview> {

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

    public projectReviewer(): ProjectReviewer<ProjectReview> {
        return (id, p) => {
            const pom = p.findFileSync("pom.xml");
            if (!pom) {
                return Promise.resolve(undefined);
            } else {
                // This is naive
                const outDated = pom.getContentSync().includes("spring")
                    && pom.getContentSync().includes(this.desiredBootVersion);
                if (outDated) {
                    return Promise.resolve({
                        repoId: id,
                        comments: [
                            {
                                severity: "info",
                                comment: "Old version of Spring Boot",
                            },
                        ],
                    });
                } else {
                    return Promise.resolve(clean(id));
                }
            }
        };
    }

}