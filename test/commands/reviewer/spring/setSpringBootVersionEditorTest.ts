import "mocha";

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import { RepoId, SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import * as assert from "power-assert";
import { setSpringBootVersionEditor } from "../../../../src/commands/editor/spring/setSpringBootVersionEditor";
import { springBootPom } from "../Poms";

describe("setSpringBootVersionEditor", () => {

    it("doesn't edit empty project", done => {
        const p = new InMemoryProject("");
        setSpringBootVersionEditor("1.3.1")(null, p, null)
            .then(r => {
                assert(!r.edited);
                done();
            }).catch(done);
    });

    it("reports editing Spring Boot project", done => {
        const p = InMemoryProject.of({path: "pom.xml", content: springBootPom("1.3.0")});
        const repoId: RepoId = new SimpleRepoId("a", "b");
        setSpringBootVersionEditor("1.3.1")(repoId, p, null)
            .then(r => {
                assert(r.edited);
                done();
            }).catch(done);
    });

    it("actually edits Spring Boot project", done => {
        const p = InMemoryProject.of({path: "pom.xml", content: springBootPom("1.3.0")});
        const repoId: RepoId = new SimpleRepoId("a", "b");
        setSpringBootVersionEditor("1.3.1")(repoId, p, null)
            .then(r => {
                assert(r.edited);
                assert(p.findFileSync("pom.xml").getContentSync().includes("1.3.1"));
                done();
            }).catch(done);
    });

});
