const spawnMinions = require("./spawnMinions");
const ansiRegex = require("ansi-regex")();

module.exports = function getNpmTags(dependencyName, isVerbose) {
    const command = `npm view ${dependencyName} versions`;

    return spawnMinions(command, isVerbose).then(result => {
        const strippedColors = result.replace(ansiRegex, "").replace(/'/g, '"');

        try {
            return JSON.parse(strippedColors);
        } catch (e) {
            throw new Error("Could not parse as JSON: " + strippedColors);
        }
    });
};
