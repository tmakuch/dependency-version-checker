#!/usr/bin/env node
const logic = require("./index");
const findClosestPackage = require("./lib/findClosestPackage");
const drawTable = require("./lib/drawCliTable");
const p = require("bluebird");
const dvcPackageInfo = require("./package");

const yargs = require("yargs").command(require("./yargsModule")).argv;

const packagePath = findClosestPackage();

if (!packagePath) {
    console.error("Could not find package.json");
    return process.exit(-1);
}

return selfCheck(yargs)
    .then(() => {
        console.log(
            `Performing dependency updates check for project: ${packagePath}.`
        );
        console.log(
            `Check will be performed for dependencies matching this regex: /${
                yargs.rule
            }/.\n`
        );
        return logic.findPackagesToUpdate(packagePath, yargs.rule, yargs);
    })
    .then(dependencies => {
        let visible = dependencies;

        if (yargs.hideErrors) {
            visible = dependencies.filter(dep => !dep.error);
            console.log(
                `${dependencies.length - visible.length} error(s) were hidden.`
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
            errorFromColumn: 2,
            data: yargs.hideNext ? updates : visible
        });
    })
    .catch(console.error);

function selfCheck(options) {
    //this lib checks if the dependencies are up to date, i would say it just in character  :P
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
}
