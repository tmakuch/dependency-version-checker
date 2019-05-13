#!/usr/bin/env node
const logic = require("./index");
const findClosestPackage = require("./lib/findClosestPackage");
const drawTable = require("./lib/drawCliTable");

const yargs = require("yargs").command(require("./yargsModule")).argv;

const packagePath = findClosestPackage();

if (!packagePath) {
    console.error("Could not find package.json");
    return process.exit(-1);
}

console.log(`Performing dependency updates check for project: ${packagePath}.`);
console.log(
    `Check will be performed for dependencies matching this regex: /${
        yargs.rule
    }/.\n`
);

return logic(packagePath, yargs.rule, yargs)
    .then(dependencies => {
        const successes = dependencies.filter(dep => !dep.error);
        const updates = successes.filter(dep => dep.latestMinor || dep.latestMajor);

        if (!updates.length) {
            console.log("Awesome, all your dependencies are up to date!\n");
        } else {
            console.log(
                `You could update ${updates.length} dependency(/-ies). \n`
            );
        }

        drawTable({
            headers: {
                name: "Dependency",
                type: "Type",
                currentVersion: "Current Version",
                latestMinor: "Latest Minor",
                latestMajor: "Latest Major"
            },
            data: successes
        });

        console.log("");

        if (yargs.showErrors) {
            const fails = dependencies.filter(dep => dep.error);

            if (!fails.length) {
                console.log("No errors encountered during dependencies check.");
                return;
            }

            console.log(`There were ${fails.length} failed check(s). \n`);

            drawTable({
                headers: {
                    name: "Dependency",
                    type: "Type",
                    error: "Error"
                },
                data: fails
            });
        }
    })
    .catch(console.error);
