const minions = require("./minions");
const p = require("bluebird");

module.exports = {
    get: getGitTags
};

function getGitTags(dependency, isVerbose) {
    return p
        .try(() => getGitUrl(dependency))
        .tap(
            gitUrl =>
                isVerbose &&
                console.debug(`"${dependency.name}" is on ${gitUrl}.`)
        )
        .then(gitUrl =>
            minions.spawn(
                `git ls-remote --tags --refs --sort="-v:refname" ${gitUrl}`,
                isVerbose
            )
        )
        .then(parseLsRemoteResponse);
}

function getGitUrl(dependency) {
    return dependency.version.replace(/#semver:[^\s]+$/, "");
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
