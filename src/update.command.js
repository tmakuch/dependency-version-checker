const logic = require("./logic");
const drawTable = require("./cliHelpers/drawCliTable");
const spinner = require("./cliHelpers/spinner")();
const p = require("bluebird");
const fs = p.promisifyAll(require("fs"));
const DEP_TYPE = require("./enums/DEP_TYPE");

module.exports = {
    command: "update [rule]",
    describe:
        "Check all dependencies versions and update package.json file with latest version of each file",
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
        "ignore-minor": {
            type: "boolean",
            description: "Does not update dependencies with minor version. Can't be used with --ignore-major"
        },
        "ignore-major": {
            type: "boolean",
            description: "Does not update dependencies with major version. Can't be used with --ignore-minor"
        },
        "ignore-dev": {
            type: "boolean",
            description: "Does not update dev dependencies. Can't be used with --ignore-prod"
        },
        "ignore-prod": {
            type: "boolean",
            description: "Does not update prod dependencies. Can't be used with --ignore-dev"
        },
        verbose: {
            type: "boolean",
            description: "Printing a lot of debug data"
        },
        "hide-ignored": {
            type: "boolean",
            description: "Hide ignored dependencies"
        },
        "hide-unchanged": {
            type: "boolean",
            description: "Hide dependencies that were not changed"
        },
        "hide-errors": {
            type: "boolean",
            description: "Hide errors in the table"
        }
    },
    handler
};

const depContainerNames = {
    [DEP_TYPE.PROD]: "dependencies",
    [DEP_TYPE.DEV]: "devDependencies"
};

function handler(yargs) {
    if (
        (yargs.ignoreMinor && yargs.ignoreMajor) ||
        (yargs.ignoreProd && yargs.ignoreDev)
    ) {
        console.error(
            "Wait, what do you want from me?\nCheck --help for list of right arguments - you've provided excluding filters."
        );
        return process.exit(-1);
    }

    return p
        .try(() => {
            console.log(
                `Performing dependency updates check for project: ${
                    yargs.packagePath
                }.`
            );
            console.log(
                `Check will be performed for dependencies matching this regex: /${
                    yargs.rule
                }/.\n`
            );

            return p.props({
                spinnerInstance: spinner.start(
                    "Getting dependencies versions."
                ),
                packageJson: fs
                    .readFileAsync(yargs.packagePath)
                    .then(JSON.parse),
                dependencies: logic.findPackagesToUpdate(
                    yargs.packagePath,
                    yargs.rule,
                    yargs
                )
            });
        })
        .then(({ spinnerInstance, packageJson, dependencies }) => {
            spinnerInstance.stop();
            dependencies.forEach(dependency => {
                if (
                    (dependency.type === DEP_TYPE.DEV && yargs.ignoreDev) ||
                    (dependency.type === DEP_TYPE.PROD && yargs.ignoreProd)
                ) {
                    dependency.ignored = true;
                    dependency.updatedTo = "Ignored by type";
                    return;
                }

                if (!dependency.latestMajor && !dependency.latestMinor) {
                    dependency.updatedTo = null;
                    return;
                }

                const nextVersion =
                    (!yargs.ignoreMajor && dependency.latestMajor) ||
                    (!yargs.ignoreMinor && dependency.latestMinor);

                if (!nextVersion) {
                    dependency.ignored = true;
                    dependency.updatedTo = "Ignored by version";
                    return;
                }

                dependency.updatedTo = nextVersion;

                const container = depContainerNames[dependency.type];
                packageJson[container][dependency.name] = packageJson[
                    container
                ][dependency.name].replace(
                    dependency.currentVersion,
                    nextVersion
                );
            });

            return p.props({
                fileWrite: fs.writeFileAsync(
                    yargs.packagePath,
                    JSON.stringify(packageJson)
                ),
                dependencies
            });
        })
        .then(({ dependencies }) => {
            let filtered = dependencies;

            if (yargs.hideErrors) {
                filtered = filtered.filter(dep => !dep.error);
                console.log(
                    `${dependencies.length -
                        filtered.length} error(s) were hidden.`
                );
            }

            if (yargs.hideUnchanged) {
                const before = filtered.length;
                filtered = filtered.filter(dep => dep.updatedTo || dep.error);
                console.log(
                    `${before -
                        filtered.length} unchanged dependenct(-ies) were hidden.`
                );
            }

            if (yargs.hideIgnored) {
                const before = filtered.length;
                filtered = filtered.filter(dep => !dep.ignored);
                console.log(
                    `${before -
                        filtered.length} ignored dependency(-ies) were hidden.`
                );
            }

            console.log();
            drawTable({
                headers: {
                    name: "Dependency",
                    type: "Type",
                    currentVersion: "Current Version",
                    latestMinor: "Latest Minor",
                    latestMajor: "Latest Major",
                    updatedTo: "Changed to"
                },
                customEntry: {
                    fromColumn: 2,
                    getter: entry => entry.error
                },
                data: filtered
            });

            console.log("\nRemember to run 'npm install' to install the dependencies.")
        })
        .catch(console.error);
}