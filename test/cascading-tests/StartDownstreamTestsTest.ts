import "mocha";
const fs = require("fs");

import * as assert from "power-assert";
import { parseCascadeTag } from "../../src/cascading-tests/StartDownstreamTests";

describe("StartDownloadTests", () => {

    it("extract module name from tag", () => {
        const test = "@atomist/microgrammar_cdupuis-patch-3-0.7.0";
        const [name, version] = parseCascadeTag([ {name: test }]);
        assert(name === "@atomist/microgrammar_cdupuis-patch-3");
        assert(version === "0.7.0");
    });
});
