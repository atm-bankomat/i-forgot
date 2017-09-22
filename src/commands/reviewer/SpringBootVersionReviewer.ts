import { CommandHandler, Parameter, Tags } from "@atomist/automation-client/decorators";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/ProjectReviewer";
import { ReviewerSupport } from "@atomist/automation-client/operations/review/ReviewerSupport";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { ProjectNonBlocking } from "@atomist/automation-client/project/Project";
import { findFileMatches, Match } from "@atomist/automation-client/project/util/parseUtils";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { PARENT_STANZA } from "../../grammars/MavenGrammars";

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

    public projectReviewer(): ProjectReviewer<SpringBootProjectReview> {
        const desiredVersion = this.desiredBootVersion;
        return (id, p) => {
            const pom = p.findFileSync("pom.xml");
            if (!pom) {
                return Promise.resolve(undefined);
            } else {
                return findMatches(p, "pom.xml", PARENT_STANZA)
                    .then(matches => {
                        if (matches.length > 0 && matches[0].gav.artifact === "spring-boot-starter-parent") {
                            const version = matches[0].gav.version;
                            const outDated = version !== this.desiredBootVersion;
                            if (outDated) {
                                return Promise.resolve({
                                    repoId: id,
                                    comments: [
                                        {
                                            severity: "info",
                                            comment: "Old version of Spring Boot",
                                        },
                                    ],
                                    version,
                                    desiredVersion,
                                } as SpringBootProjectReview);
                            } else {
                                return Promise.resolve(clean(id));
                            }
                        }
                        return Promise.resolve(clean(id));
                    });
            }
        };
    }

}

// TODO remove with 0.1.6 release of client
function findMatches<M>(p: ProjectNonBlocking,
                        globPattern: string,
                        microgrammar: Microgrammar<M>): Promise<Array<Match<M>>> {
    return findFileMatches(p, globPattern, microgrammar)
        .then(fileHits => {
            let matches: Array<Match<M>> = [];
            for (const fh of fileHits) {
                if (fh) {
                    matches = matches.concat(fh.matches);
                }
            }
            return matches;
        });
}

export interface SpringBootProjectReview extends ProjectReview {

    version?: string;

    desiredVersion?: string;
}
