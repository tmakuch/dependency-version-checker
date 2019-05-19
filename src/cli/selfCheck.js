const p = require("bluebird");
const logic = require("../logic");
const dvcPackageInfo = require("../../package.json");

module.exports = function selfCheck(options) {
    //this src checks if the dependencies are up to date, i would say it just in character  :P
    if (!options.selfCheck) {
        return p.resolve();
    }

    //TODO do not make the check each time it's ran, make it daily?
    return logic
        .getListOfTags(dvcPackageInfo, options)
        .then(tags =>
            logic.findNextVersions(
                Object.assign(
                    {
                        tags
                    },
                    dvcPackageInfo
                ),
                options.verbose
            )
        )
        .then(({ latestMinor, latestMajor }) => {
            if (latestMinor || latestMajor) {
                const whatVersion = latestMajor ? "major" : "minor";
                console.warn(
                    `There is new ${whatVersion} version (${latestMajor ||
                    latestMinor}) for ${
                        dvcPackageInfo.name
                        }. Run "npm i -g ${dvcPackageInfo.name}" to upgrade from v${
                        dvcPackageInfo.version
                        }.\n`
                );
            }
        });
};