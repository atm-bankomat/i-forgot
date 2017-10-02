
import "mocha";

import * as assert from "power-assert";
import { dependencyGrammar } from "../../src/cascading-tests/StartDownstreamTests";

describe("dependencyGrammar", () => {

    it("should match", () => {
        const dependencyToReplace = "@atomist/microgrammar";
        const input = '"@atomist/microgrammar": "^0.6.2"';
        const m = dependencyGrammar(dependencyToReplace).findMatches(input);
        assert(m.length === 1);
        assert(m[0].name === dependencyToReplace);
        assert(m[0].version === "^0.6.2");
    });

});
