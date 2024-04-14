const path = require("path");
const exists = require("fs").existsSync;

module.exports = function findClosestPackage() {
  let current = process.cwd();
  do {
    const potentialPackage = path.join(current, "package.json");

    if (exists(potentialPackage)) {
      return potentialPackage;
    }
  } while (current !== (current = path.join(current, "..")));

  return null;
};
