
import { CommandHandler } from "@atomist/automation-client/decorators";
import { RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/ProjectReviewer";
import { ReviewerSupport } from "@atomist/automation-client/operations/review/ReviewerSupport";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { Project } from "@atomist/automation-client/project/Project";

@CommandHandler("Look for shas")
export class ShaFinder extends ReviewerSupport<ProjectReview> {

    protected projectReviewer(): ProjectReviewer<ProjectReview> {
        return (id: RepoId, p: Project) => {
            console.log("ShaFinder reviewing " + JSON.stringify(id));
            return Promise.resolve(clean(id));
        };
    }
}
