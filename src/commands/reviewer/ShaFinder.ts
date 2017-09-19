
import { CommandHandler } from "@atomist/automation-client/decorators";
import { ReviewerSupport } from "@atomist/automation-client/operations/review/ReviewerSupport";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/ProjectReviewer";
import { RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { Project } from "@atomist/automation-client/project/Project";
import { clean, ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";

@CommandHandler("Look for shas")
export class ShaFinder extends ReviewerSupport<ProjectReview> {

    public raiseIssues = false;

    protected projectReviewer(): ProjectReviewer<ProjectReview> {
        return (id: RepoId, p: Project) => {
            console.log("ShaFinder reviewing " + JSON.stringify(id));
            return Promise.resolve(clean(id));
        };
    }
}
