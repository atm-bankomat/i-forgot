import "mocha";
const fs = require("fs");

import * as assert from "power-assert";
import { analyzeLog } from "../../src/lint-fix/travis/grammar";

describe("analyzing the logs", () => {
    it("finds tslint errors", done => {
        fs.readFile("test/lint-fix/logSamples/tslintErrors.txt", "utf8",
            (err, data) => {
                assert(!err);
                const result = analyzeLog(data);
                assert(result.length > 10, "that's too short");
                done();
            })
    });
});