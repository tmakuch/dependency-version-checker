const p = require("bluebird");
const logic = require("../logic");
const dvcPackageInfo = require("../../package.json");
const loggerInit = require("./logger");

module.exports = function selfCheck(options) {
    //this src checks if the dependencies are up to date, I would say it just in character  :P
    //if we're not logging anything except the table then silent make no sens to check the version
    if (options.selfCheck === false || options.silent) {
        return p.resolve();
    }

    const logger = loggerInit(options);

    //TODO do not make the check each time it's ran, make it daily?
    return logic
        .getListOfTags(dvcPackageInfo, logger)
        .then(tags =>
            logic.findNextVersions(
                Object.assign(
                    {
                        tags
                    },
                    dvcPackageInfo
                ),
                logger
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
