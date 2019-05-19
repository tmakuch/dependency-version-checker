const findClosestPackage = require("./cli/findClosestPackage");

module.exports = () => {
    const packagePath = findClosestPackage();

    if (!packagePath) {
        console.error("Could not find package.json");
        return process.exit(-1);
    }

    return {
        packagePath
    };
};