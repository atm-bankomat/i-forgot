
import "mocha";
import * as assert from "power-assert";
import { consolidate } from "../../../../src/commands/reviewer/maven/VersionMapper";
import { VersionedArtifact } from "../../../../src/grammars/VersionedArtifact";

describe("artifact consolidate", () => {

    it("consolidates empty", () => {
        const arrs: VersionedArtifact[][] = [];
        const consolidated = consolidate(arrs);
        assert.deepEqual(consolidated, {}, JSON.stringify(consolidated));
    });

    it("consolidates single", () => {
        const arrs: VersionedArtifact[][] = [ [ { group: "g", artifact: "a", version: "1.0"}] ];
        const consolidated = consolidate(arrs);
        assert.deepEqual(consolidated,
            {
                g: {
                    a : [ "1.0"],
                },
            }, JSON.stringify(consolidated));
    });

});
