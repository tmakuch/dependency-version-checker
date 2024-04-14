const logic = require("../src/logic");
const gitTags = require("../src/helpers/gitTags");
const npmTags = require("../src/helpers/npmTags");
const testPackagePath = require("path").join(__dirname, "/package.json");

const tags = {
    lodash: ["3.5.1", "4.5.1"],
    underscore: ["1.9.1"],
    eslint: ["5.16.0"],
    immutable: ["3.8.2"],
    "backbone-redux-migrator": ["1.1.0-1", "1.1.0-2", "1.1.0-3"]
};

describe("logic", () => {
    beforeEach(() => {
        const getter = dep => {
            if (!tags[dep.name]) {
                return Promise.reject(new Error("nope"));
            }

            return Promise.resolve(tags[dep.name]);
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
                        error: "Error caught: nope"
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
                        name: "backbone-redux-migrator",
                        type: "Prod",
                        currentVersion: "1.1.0-1",
                        latestMinor: "1.1.0-3",
                        latestMajor: null
                    },
                    {
                        name: "something-that-should-not-exist",
                        type: "Dev",
                        error: "Error caught: nope"
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
