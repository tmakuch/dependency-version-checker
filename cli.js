#!/usr/bin/env node
const logic = require("./index");
const findClosestPackage = require("./lib/findClosestPackage");
const drawTable = require("./lib/drawCliTable");

const packagePath = findClosestPackage();
const rawRule = process.argv[2];

if (!packagePath) {
    console.error("Could not find package.json");
    return process.exit(-1);
}

if (!rawRule) {
    console.warn("No rule provided for dependencies to check.")
}

const rule = rawRule || ".*";
console.log(`Performing dependency updates check for project: ${packagePath}.`);
console.log(`Check will be performed for dependencies matching this regex: /${rule}/.\n`);

return logic(packagePath, rule)
    .then(dependencies => dependencies.filter(dep => !dep.error))
    .then(dependencies => {
        const updates = dependencies.filter(dep => dep.nextVersion);

        if (!updates.length) {
            console.log("Awesome, all your dependencies are up to date!\n");
        } else {
            console.log(`You could update ${updates.length} dependency(/-ies). \n`);
        }

        drawTable({
            headers: {
                name: "Dependency",
                type: "Type",
                currentVersion: "Current Version",
                nextVersion: "Next version",
                latestVersion: "Latest version"
            },
            data: dependencies
        });
    })
    .catch(console.error);