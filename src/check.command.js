const logic = require("./logic");
const selfCheck = require("./cliHelpers/selfCheck");
const drawTable = require("./cliHelpers/drawCliTable");
const spinner = require("./cliHelpers/spinner")();
const p = require("bluebird");

module.exports = {
    command: "check [rule]",
    describe: "Check all dependencies for updates",
    builder: {
        help: {
            hidden: true
        },
        version: {
            hidden: true
        },
        rule: {
            type: "string",
            description:
                "String regex that will be used to match dependency name",
            default: ".*"
        },
        "no-self-check": {
            type: "boolean",
            description: "Omits version check for this code"
        },
        "hide-empty": {
            type: "boolean",
            description: "Hide entries that are up to date"
        },
        verbose: {
            type: "boolean",
            description: "Printing a lot of debug data"
        },
        "hide-errors": {
            type: "boolean",
            description: "Hide errors in the table"
        }
    },
    handler
};

function handler(yargs) {
    return selfCheck(yargs)
        .then(() => {
            console.log(
                `Performing dependency updates check for project: ${yargs.packagePath}.`
            );
            console.log(
                `Check will be performed for dependencies matching this regex: /${
                    yargs.rule
                }/.\n`
            );

            return p.props({
                spinnerInstance: spinner.start("Getting dependencies versions."),
                dependencies: logic.findPackagesToUpdate(yargs.packagePath, yargs.rule, yargs)
            });
        })
        .then(({ spinnerInstance, dependencies }) => {
            spinnerInstance.stop();
            let visible = dependencies;

            if (yargs.hideErrors) {
                visible = dependencies.filter(dep => !dep.error);
                console.log(
                    `${dependencies.length -
                        visible.length} error(s) were hidden.`
                );
            }

            const updates = visible.filter(
                dep => dep.latestMinor || dep.latestMajor || dep.error
            );

            if (!updates.length) {
                console.log("Awesome, all your dependencies are up to date!");
            } else {
                console.log(
                    `You could update ${updates.length} dependency(/-ies).`
                );
            }

            console.log();
            drawTable({
                headers: {
                    name: "Dependency",
                    type: "Type",
                    currentVersion: "Current Version",
                    latestMinor: "Latest Minor",
                    latestMajor: "Latest Major"
                },
                customEntry: {
                    fromColumn: 2,
                    getter: entry => entry.error
                },
                data: yargs.hideEmpty ? updates : visible
            });
        })
        .catch(console.error);
}
