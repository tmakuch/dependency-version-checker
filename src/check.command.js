const logic = require("./logic");
const selfCheck = require("./cliHelpers/selfCheck");
const drawTable = require("./cliHelpers/drawCliTable");
const loggerInit = require("./cliHelpers/logger");
const commons = require("./commandsCommons");

module.exports = {
  command: "check [rule]",
  describe: "Check all dependencies for updates",
  builder: Object.assign(
    {
      "no-self-check": {
        type: "boolean",
        description: "Omits version check for this code",
      },
      "hide-empty": {
        type: "boolean",
        description: "Hide entries that are up to date",
      },
    },
    commons.options,
  ),
  handler,
};

function handler(yargs) {
  const logger = loggerInit(yargs);
  return selfCheck(yargs)
    .then(() => {
      logger.log(
        `Performing dependency updates check for project: ${yargs.packagePath}.`,
      );
      logger.log(
        `Check will be performed for dependencies matching this regex: /${yargs.rule}/.\n`,
      );

      return Promise.all([
        logger.spinner &&
          logger.spinner.start("Getting dependencies versions."),
        logic.findPackagesToUpdate(yargs.packagePath, yargs.rule, yargs),
      ]).then(([spinnerInstance, dependencies]) => ({
        spinnerInstance,
        dependencies,
      }));
    })
    .then(({ spinnerInstance, dependencies }) => {
      if (spinnerInstance) {
        spinnerInstance.stop();
      }

      let visible = dependencies;

      if (yargs.hideErrors) {
        visible = dependencies.filter((dep) => !dep.error);
        logger.log(
          `${dependencies.length - visible.length} error(s) were hidden.`,
        );
      }

      const nonEmpty = visible.filter(
        (dep) => dep.latestMinor || dep.latestMajor || dep.error,
      );

      const updates = nonEmpty.filter(
        (dep) => dep.latestMinor || dep.latestMajor,
      );
      if (!updates.length) {
        logger.log("Awesome, all your dependencies are up to date!");
      } else {
        logger.log(`You could update ${updates.length} dependency(/-ies).`);
      }

      logger.log();
      drawTable({
        headers: {
          name: "Dependency",
          type: "Type",
          currentVersion: "Current Version",
          latestMinor: "Latest Minor",
          latestMajor: "Latest Major",
        },
        customEntry: {
          fromColumn: 2,
          getter: (entry) => entry.error,
        },
        data: yargs.hideEmpty ? nonEmpty : visible,
      });
    })
    .catch(logger.error);
}
