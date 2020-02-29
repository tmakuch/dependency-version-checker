const logic = require("./logic");
const drawTable = require("./cliHelpers/drawCliTable");
const p = require("bluebird");
const fs = p.promisifyAll(require("fs"));
const DEP_TYPE = require("./enums/DEP_TYPE");
const loggerInit = require("./cliHelpers/logger");
const commons = require("./commandsCommons");

module.exports = {
    command: "update [rule]",
    describe:
        "Check all dependencies versions and update package.json file with latest version of each file",
    builder: Object.assign(
        {
            "ignore-minor": {
                type: "boolean",
                description:
                    "Does not update dependencies with minor version. Can't be used with --ignore-major"
            },
            "ignore-major": {
                type: "boolean",
                description:
                    "Does not update dependencies with major version. Can't be used with --ignore-minor"
            },
            "ignore-dev": {
                type: "boolean",
                description:
                    "Does not update dev dependencies. Can't be used with --ignore-prod"
            },
            "ignore-prod": {
                type: "boolean",
                description:
                    "Does not update prod dependencies. Can't be used with --ignore-dev"
            },
            "hide-ignored": {
                type: "boolean",
                description: "Hide ignored dependencies"
            },
            "hide-unchanged": {
                type: "boolean",
                description: "Hide dependencies that were not changed"
            }
        },
        commons.options
    ),
    handler
};

const depContainerNames = {
    [DEP_TYPE.PROD]: "dependencies",
    [DEP_TYPE.DEV]: "devDependencies"
};

function handler(yargs) {
    const logger = loggerInit(yargs);
    if (
        (yargs.ignoreMinor && yargs.ignoreMajor) ||
        (yargs.ignoreProd && yargs.ignoreDev)
    ) {
        logger.error(
            "Wait, what do you want from me?\nCheck --help for list of right arguments - you've provided excluding filters."
        );
        return process.exit(-1);
    }

    return p
        .try(() => {
            logger.log(
                `Performing dependency updates check for project: ${
                    yargs.packagePath
                }.`
            );
            logger.log(
                `Check will be performed for dependencies matching this regex: /${
                    yargs.rule
                }/.\n`
            );

            return p.props({
                spinnerInstance:
                    logger.spinner &&
                    logger.spinner.start("Getting dependencies versions."),
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
            if (spinnerInstance) {
                spinnerInstance.stop();
            }

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
                logger.log(
                    `${dependencies.length -
                        filtered.length} error(s) were hidden.`
                );
            }

            if (yargs.hideUnchanged) {
                const before = filtered.length;
                filtered = filtered.filter(dep => dep.updatedTo || dep.error);
                logger.log(
                    `${before -
                        filtered.length} unchanged dependenct(-ies) were hidden.`
                );
            }

            if (yargs.hideIgnored) {
                const before = filtered.length;
                filtered = filtered.filter(dep => !dep.ignored);
                logger.log(
                    `${before -
                        filtered.length} ignored dependency(-ies) were hidden.`
                );
            }

            logger.log();
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

            logger.log(
                "\nRemember to run 'npm install' to install the dependencies."
            );
        })
        .catch(logger.error);
}
