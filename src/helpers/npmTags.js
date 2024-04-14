const minions = require("./minions");
const ansiRegex = require("ansi-regex")();

module.exports = {
  get: getNpmTags,
};

function getNpmTags(dependency, logger) {
  const command = `npm view ${dependency.name} versions`;

  return minions.spawn(command, logger).then((result) => {
    const strippedColors = result.replace(ansiRegex, "").replace(/'/g, '"');

    try {
      return JSON.parse(strippedColors);
    } catch (e) {
      throw new Error("Could not parse as JSON: " + strippedColors);
    }
  });
}
