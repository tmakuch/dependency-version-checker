const logic = require("../src/logic");
const gitTags = require("../src/helpers/gitTags");
const npmTags = require("../src/helpers/npmTags");
const testPackagePath = require("path").join(__dirname, "/package.json");

const tags = {
    lodash: ["3.5.1", "4.5.1"],
    underscore: ["1.9.1"],
    eslint: ["5.16.0"],
    immutable: ["3.8.2"]
};

describe("logic", () => {
    beforeEach(() => {
        const getter = dep => {
            if (!tags[dep.name]) {
                throw new Error("nope");
            }

            return tags[dep.name];
        };
        spyOn(gitTags, "get").and.callFake(getter);
        spyOn(npmTags, "get").and.callFake(getter);
    });

    it("should return all dependencies with default rule provided", () =>
        logic
            .findPackagesToUpdate(testPackagePath, ".*", {})
            .then(dependencies =>
                expect(dependencies).toEqual([
                    {
                        name: "lodash",
                        type: "Prod",
                        currentVersion: "3.0.0",
                        latestMinor: "3.5.1",
                        latestMajor: "4.5.1"
                    },
                    {
                        name: "undercore",
                        type: "Prod",
                        error: "nope"
                    },
                    {
                        name: "eslint",
                        type: "Prod",
                        currentVersion: "5.16.0",
                        latestMinor: null,
                        latestMajor: null
                    },
                    {
                        name: "immutable",
                        type: "Prod",
                        currentVersion: "3.7.6",
                        latestMinor: "3.8.2",
                        latestMajor: null
                    },
                    {
                        name: "something-that-should-not-exist",
                        type: "Dev",
                        error: "nope"
                    }
                ])
            ));

    it("should return single dependencies with specific rule probided", () =>
        logic
            .findPackagesToUpdate(testPackagePath, "lodash", {})
            .then(dependencies =>
                expect(dependencies).toEqual([
                    {
                        name: "lodash",
                        type: "Prod",
                        currentVersion: "3.0.0",
                        latestMinor: "3.5.1",
                        latestMajor: "4.5.1"
                    }
                ])
            ));
});
