const getGitTags = require("./lib/getGitTags");
const getNpmTags = require("./lib/getNpmTags");
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
                .try(() => getListOfTags(dependency, options))
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

function getListOfTags(dependency, options) {
    const doesItLookLikeGitLink = dependency.version.includes("#semver:");

    if (doesItLookLikeGitLink) {
        return p.try(() => getGitTags(dependency, options.verbose));
    }

    return p.try(() => getNpmTags(dependency.name, options.verbose));
}

function findNextVersions({ name, type, version, tags }, isVerbose) {
    let currentVersion;

    if (version.includes("#semver:")) {
        currentVersion = semver.coerce(/#semver:(.+)/.exec(version)[1]);
    } else {
        currentVersion = semver.coerce(version);
    }

    if (isVerbose) {
        console.debug(
            `Current version for "${name}" is ${JSON.stringify(currentVersion)}`
        );
    }

    const latestMinor = semver.maxSatisfying(
        tags,
        `>${currentVersion.version} <${currentVersion.major + 1}`
    );
    const latestMajor = semver.maxSatisfying(
        tags,
        `>${currentVersion.version}`
    );

    return {
        name,
        type,
        currentVersion: currentVersion.version,
        latestMinor,
        latestMajor: latestMajor !== latestMinor ? latestMajor : null
    };
}
