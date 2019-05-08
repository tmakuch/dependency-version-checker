const getGitTags = require("./lib/getGitTags");
const p = require("bluebird");
const path = require("path");
const readFilePromise = p.promisify(require("fs").readFile);
const semver = require("semver");

module.exports = function findPackagesToUpdate(pckPath, rule) {
    const isOurDependency = getDependenciesChecker(rule);

    return readFilePromise(path.resolve(pckPath))
        .then(JSON.parse)
        .then(pck =>
            [
                ...Object.entries(pck.dependencies || [])
                    .map(([name, version]) => ({name, type: "Prod", version})),
                ...Object.entries(pck.devDependencies || [])
                    .map(([name, version]) => ({name, type: "Dev", version}))

            ]
                .filter(isOurDependency)
        )
        .map(dependency =>
            p
                .resolve(dependency)
                .then(getGitUrl)
                .then(getGitTags)
                .then(parseLsRemoteResponse)
                .then(result => Object.assign(dependency, {tags: result}))
                .then(findNextVersions)
                .catch(err => ({
                    name: dependency.name,
                    type: dependency.type,
                    error: err.message
                }))
        );
};

function getDependenciesChecker(rule) {
    const check = new RegExp(rule);
    return dependency => {
        return check.test(dependency.name);
    }
}

function getGitUrl(dependency) {
    if (dependency.version.includes("#semver:")) {
        return dependency.version.replace(/#semver:[^\s]+$/, "");
    }

    throw new Error("This does not look like link with #semver tag");
}

function parseLsRemoteResponse(response) {
    return response
        .split("\n")
        .map(line => line.includes("refs/tags/") && /refs\/tags\/v?(.+)/.exec(line)[1])
        .filter(ver => ver);
}

function findNextVersions({name, type, version, tags}) {
    if (!version.includes("#semver:")) {
        return null;
    }

    const currentVersion = semver.coerce(/#semver:(.+)/.exec(version)[1]);

    return {
        name,
        type,
        currentVersion: currentVersion.version,
        nextVersion: semver.minSatisfying(tags, ">" + currentVersion.version),
        latestVersion: semver.maxSatisfying(tags, ">" + currentVersion.version)
    };
}
