
import { CommandHandler } from "@atomist/automation-client/decorators";
import { RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { ReviewerCommandSupport } from "@atomist/automation-client/operations/review/ReviewerCommandSupport";
import { clean, ProjectReview, ReviewResult } from "@atomist/automation-client/operations/review/ReviewResult";
import { Project } from "@atomist/automation-client/project/Project";

/**
 * Find shas in files. These should not be stored in repos.
 */
@CommandHandler("Look for shas")
export class ShaFinder extends ReviewerCommandSupport<ReviewResult<ProjectReview>, ProjectReview> {

    public projectReviewer(): ProjectReviewer<ProjectReview> {
        return (id: RepoId, p: Project) => {
            // TODO incomplete
            console.log("ShaFinder reviewing " + JSON.stringify(id));
            return Promise.resolve(clean(id));
        };
    }
}
