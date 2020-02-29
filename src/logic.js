const gitTags = require("./helpers/gitTags");
const npmTags = require("./helpers/npmTags");
const p = require("bluebird");
const path = require("path");
const readFilePromise = p.promisify(require("fs").readFile);
const semver = require("semver");
const DEP_TYPE = require("./enums/DEP_TYPE");
const loggerInit = require("./cliHelpers/logger");

const semverOptions = { loose: true, includePrerelease: true };

module.exports = {
    findPackagesToUpdate,
    getListOfTags,
    findNextVersions
};

function findPackagesToUpdate(pckPath, rule, options) {
    const logger = loggerInit(options);
    logger.debug(`Found package file: ${pckPath}. Rule set to ${rule}.`);

    const isOurDependency = getDependenciesChecker(rule);

    return readFilePromise(path.resolve(pckPath))
        .then(JSON.parse)
        .then(pck =>
            [
                ...Object.entries(pck.dependencies || []).map(
                    ([name, version]) => ({
                        name,
                        type: DEP_TYPE.PROD,
                        version
                    })
                ),
                ...Object.entries(pck.devDependencies || []).map(
                    ([name, version]) => ({ name, type: DEP_TYPE.DEV, version })
                )
            ].filter(isOurDependency)
        )
        .tap(dependencies =>
            logger.debug(
                `Dependencies found: ${dependencies
                    .map(({ name, type }) => `${name} (${type})`)
                    .join(", ")}`
            )
        )
        .map(dependency =>
            p
                .try(() => getListOfTags(dependency, logger))
                .then(result => Object.assign(dependency, { tags: result }))
                .then(dep => findNextVersions(dep, options, logger))
                .catch(err => {
                    logger.childError(err.message || err);
                    return {
                        name: dependency.name,
                        type: dependency.type,
                        error: "Error caught: " + (err.message || "-unhandled-")
                    };
                })
        );
}

function getDependenciesChecker(rule) {
    const check = new RegExp(rule);
    return dependency => {
        return check.test(dependency.name);
    };
}

function getListOfTags(dependency, logger) {
    const doesItLookLikeGitLink = dependency.version.includes("#semver:");
    const getter = doesItLookLikeGitLink ? gitTags.get : npmTags.get;

    return p.try(() => getter(dependency, logger));
}

function findNextVersions({ name, type, version, tags }, options, logger) {
    let currentVersion;
    const safeTags = tags.map(tag => {
        const safe = semver(tag, semverOptions);

        if (!safe) {
            logger.debug(`Package ${name} has a strange tag (${tag}) - it couldn't be parsed by semver lib.`);
        }

        return safe
    });

    if (version.includes("#semver:")) {
        //semver.coerce drops any loose or prerelease info, we do not want it - thus manual cleanup is required
        const regexped = /#semver:[~^]?(.+)/.exec(version)[1];
        currentVersion = semver(regexped, semverOptions);
    } else {
        //semver.coerce drops any loose or prerelease info, we do not want it - thus manual cleanup is required
        const cleaned = version.replace(/[~^]/, "");
        currentVersion = semver(cleaned, semverOptions);
    }

    logger.debug(
        `Current version for "${name}" is ${JSON.stringify(currentVersion)}`
    );

    const latestMinor = semver.maxSatisfying(
        safeTags.filter(tag => tag.major <= currentVersion.major), // to remove n+1.0.0-rc1 from >n.x.y searches when including prereleases
        `>${currentVersion.version} <${currentVersion.major + 1}`,
        {
            includePrerelease: options.includePrerelease
        }
    );
    const latestMajor = semver.maxSatisfying(
        safeTags,
        `>${currentVersion.version}`,
        {
            includePrerelease: options.includePrerelease
        }
    );

    return {
        name,
        type,
        currentVersion: currentVersion.version,
        latestMinor: latestMinor && latestMinor.raw,
        latestMajor: latestMajor !== latestMinor ? (latestMajor && latestMajor.raw) : null
    };
}
