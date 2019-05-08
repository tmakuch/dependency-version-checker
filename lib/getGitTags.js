const spawnShell = require("spawn-shell");
const concat = require("concat-stream");

module.exports = function getGitTags(gitUrl) {
    const childProcess = spawnShell(
        `git ls-remote --tags --refs --sort=\"-v:refname\" ${gitUrl}`,
        {
            stdio: [0, "pipe", "pipe"],
            env: process.env
        }
    );

    const stdoutPromise = new Promise((resolve, reject) =>
        childProcess.stdout
            .pipe(
                concat({encoding: 'string'}, result => resolve(result))
            )
            .on("error", err => reject(err))
    );

    const stderrPromise = new Promise((resolve, reject) =>
        childProcess.stderr
            .pipe(
                concat({encoding: 'string'}, result => resolve(result))
            )
            .on("error", err => reject(err))
    );

    const exitPromise = new Promise((resolve, reject) =>
        childProcess.exitPromise.then(exitCode => exitCode === 0 ? resolve() : reject(exitCode))
    );

    return exitPromise.then(
        () => stdoutPromise, //exit code 0, returning stdout
        exitCode => stderrPromise.then(
            //exit code !0, returning stderr
            errorMessage => Promise.reject(`Child process failed with exit code ${exitCode}.\n${errorMessage}`),
            //exit code !0, returning error from gettings stderr
            errorMessage => Promise.reject(`Child process failed with exit code ${exitCode}.\n${errorMessage}`),
        )
    );
};