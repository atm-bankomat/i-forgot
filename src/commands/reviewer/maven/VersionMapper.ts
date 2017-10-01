import * as _ from "lodash";

import { CommandHandler, Tags } from "@atomist/automation-client/decorators";
import { HandleCommand } from "@atomist/automation-client/HandleCommand";
import { HandlerContext } from "@atomist/automation-client/HandlerContext";
import { HandlerResult } from "@atomist/automation-client/HandlerResult";
import { hasFile } from "@atomist/automation-client/internal/util/gitHub";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { LocalOrRemoteRepoOperation } from "@atomist/automation-client/operations/common/LocalOrRemoteRepoOperation";
import { findMatches } from "@atomist/automation-client/project/util/parseUtils";
import { ArtifactContainer, DependencyGrammar } from "../../../grammars/mavenGrammars";
import { VersionedArtifact } from "../../../grammars/VersionedArtifact";
import { expandProperties } from "./utils";

@CommandHandler("Reviewer that reports the range of versions of all Maven dependencies", "version map")
@Tags("atomist", "maven", "library")
export class VersionMapper extends LocalOrRemoteRepoOperation implements HandleCommand {

    constructor() {
        // Check with an API call if the repo has a POM,
        // to save unnecessary cloning
        super(r => this.local ? Promise.resolve(true) : hasFile(this.githubToken, r.owner, r.repo, "pom.xml"));
    }

    public handle(context: HandlerContext): Promise<HandlerResult> {
        // First, look for projects and work out version spread
        return this.repoFinder()(context)
            .then(repoIds => {
                const reposToEdit = repoIds.filter(this.repoFilter);
                logger.info("Repos to edit are " + reposToEdit.map(r => r.repo).join(","));
                const allArtifactPromises: Array<Promise<VersionedArtifact[]>> =
                    reposToEdit.map(id =>
                        this.repoLoader()(id)
                            .then(project => {
                                return findMatches<ArtifactContainer>(project, "pom.xml",
                                    DependencyGrammar, {contentTransformer: expandProperties},
                                )
                                    .then(match => match.map(m => m.gav));
                            })
                            .catch(err => {
                                logger.warn("Error loading repo %s:%s - continuing...", id.owner, id.repo);
                                return Promise.resolve(undefined);
                            }),
                    );
                const arrayOfArrays: Promise<VersionedArtifact[][]> = Promise.all(allArtifactPromises);
                return arrayOfArrays
                    .then(pp => pp.filter(t => !!t))
                    .then(arr => {
                        return {
                            code: 0,
                            map: consolidate(arr),
                        };
                    });
            });
    }

}

export function consolidate(arrs: VersionedArtifact[][]): object {
    // Put in the aggregate version information
    const allArtifacts: VersionedArtifact[] = _.flatten(arrs);
    const distinctArtifacts = _.uniqBy(allArtifacts, a => a.group + ":" + a.artifact + ":" + a.version);
    const byGroup: _.Dictionary<any[]> = _.groupBy(distinctArtifacts,
        a => a.group);
    for (const group of Object.getOwnPropertyNames(byGroup)) {
        (byGroup[group] as any) = _.groupBy(byGroup[group], a => a.artifact);
        for (const artifact of Object.getOwnPropertyNames(byGroup[group])) {
            console.log("artifact=" + artifact);
            byGroup[group][artifact] = byGroup[group][artifact].map(gav => gav.version);
        }
    }
    return byGroup;
}
