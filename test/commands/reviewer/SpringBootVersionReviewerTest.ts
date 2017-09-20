import "mocha";

import * as assert from "power-assert";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { NonSpringPom, springBootPom } from "./Poms";
import { SpringBootVersionReviewer } from "../../../src/commands/reviewer/SpringBootVersionReviewer";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/ProjectReviewer";
import { ProjectReview } from "@atomist/automation-client/operations/review/ReviewResult";
import { RepoId, SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";

describe("SpringBootVersionReviewer", () => {

    function reviewer(): ProjectReviewer<ProjectReview> {
        return new SpringBootVersionReviewer().projectReviewer();
    }

    it("no comments for non Spring project", done => {
        const proj = InMemoryProject.of({path: "pom.xml", content: NonSpringPom});
        const id: RepoId = new SimpleRepoId("a", "b");
        reviewer()(id, proj).then(rev => {
            assert(rev.repoId.owner === id.owner);
            assert(rev.repoId.repo === id.repo);
            assert(rev.comments.length === 0);
            done();
        }).catch(done);
    });

    it("comment for old Spring project", done => {
        const proj = InMemoryProject.of({path: "pom.xml", content: springBootPom("1.3.0") });
        const id: RepoId = new SimpleRepoId("a", "b");
        reviewer()(id, proj).then(rev => {
            assert(rev.repoId.owner === id.owner);
            assert(rev.repoId.repo === id.repo);
            assert(rev.comments.length === 0);
            done();
        }).catch(done);
    });

});
