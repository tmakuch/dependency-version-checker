const getGitTags = require("./lib/getGitTags");
const p = require("bluebird");
const path = require("path");
const readFilePromise = p.promisify(require("fs").readFile);
const semver = require("semver");

module.exports = function findPackagesToUpdate(pckPath, rule, options) {
    if (options.verbose) {
        console.debug(`Found package file: ${pckPath}. Rule set to ${rule}.`);
    }

    const isOurDependency = getDependenciesChecker(rule);

    return readFilePromise(path.resolve(pckPath))
        .then(JSON.parse)
        .then(pck =>
            [
                ...Object.entries(pck.dependencies || []).map(
                    ([name, version]) => ({ name, type: "Prod", version })
                ),
                ...Object.entries(pck.devDependencies || []).map(
                    ([name, version]) => ({ name, type: "Dev", version })
                )
            ].filter(isOurDependency)
        )
        .tap(
            dependencies =>
                options.verbose &&
                console.debug(
                    `Dependencies found: ${dependencies
                        .map(({ name, type }) => `${name} (${type})`)
                        .join(", ")}`
                )
        )
        .map(dependency =>
            p
                .resolve(dependency)
                .then(getGitUrl)
                .tap(
                    gitUrl =>
                        options.verbose &&
                        console.debug(`"${dependency.name}" is on ${gitUrl}.`)
                )
                .then(gitUrl => getGitTags(gitUrl, options.verbose))
                .then(parseLsRemoteResponse)
                .then(result => Object.assign(dependency, { tags: result }))
                .then(dep => findNextVersions(dep, options.verbose))
                .catch(err => {
                    return {
                        name: dependency.name,
                        type: dependency.type,
                        error: err.message
                    };
                })
        );
};

function getDependenciesChecker(rule) {
    const check = new RegExp(rule);
    return dependency => {
        return check.test(dependency.name);
    };
}

function getGitUrl(dependency) {
    if (dependency.version.includes("#semver:")) {
        return dependency.version.replace(/#semver:[^\s]+$/, "");
    }

    throw new Error(
        `This (${dependency.version}) does not look like link with #semver tag`
    );
}

function parseLsRemoteResponse(response) {
    return response
        .split("\n")
        .map(
            line =>
                line.includes("refs/tags/") &&
                /refs\/tags\/v?(.+)/.exec(line)[1]
        )
        .filter(ver => ver);
}

function findNextVersions({ name, type, version, tags }, isVerbose) {
    if (!version.includes("#semver:")) {
        return null; //how the hell we would get here?
    }

    const currentVersion = semver.coerce(/#semver:(.+)/.exec(version)[1]);
    if (isVerbose) {
        console.debug(
            `Current version for "${name}" is ${JSON.stringify(currentVersion)}`
        );
    }

    return {
        name,
        type,
        currentVersion: currentVersion.version,
        nextVersion: semver.minSatisfying(tags, ">" + currentVersion.version),
        latestVersion: semver.maxSatisfying(tags, ">" + currentVersion.version)
    };
}
