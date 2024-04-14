const minions = require("./minions");

module.exports = {
  get: getGitTags,
};

function getGitTags(dependency, logger) {
  return Promise.resolve(getGitUrl(dependency))
    .then((gitUrl) => {
      logger.debug(`"${dependency.name}" is on ${gitUrl}.`);
      return minions.spawn(
        `git ls-remote --tags --refs --sort="-v:refname" ${gitUrl}`,
        logger,
      );
    })
    .then(parseLsRemoteResponse);
}

function getGitUrl(dependency) {
  return dependency.version.replace(/#semver:[^\s]+$/, "");
}

function parseLsRemoteResponse(response) {
  return response
    .split("\n")
    .map(
      (line) =>
        line.includes("refs/tags/") && /refs\/tags\/v?(.+)/.exec(line)[1],
    )
    .filter((ver) => ver);
}
