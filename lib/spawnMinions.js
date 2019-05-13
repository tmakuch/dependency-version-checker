const spawnShell = require("spawn-shell");
const concat = require("concat-stream");

module.exports = function spawnMinions(command, isVerbose) {
    if (isVerbose) {
        console.debug(`Running '${command}'.`);
    }
    const childProcess = spawnShell(command, {
        stdio: [0, "pipe", "pipe"],
        env: process.env
    });

    const stdoutPromise = new Promise((resolve, reject) =>
        childProcess.stdout
            .pipe(
                concat({ encoding: "string" }, result => {
                    if (isVerbose && result) {
                        console.debug(
                            `Standard output for ${command} is:\n ${result}`
                        );
                    }

                    return resolve(result);
                })
            )
            .on("error", err => reject(err))
    );

    const stderrPromise = new Promise((resolve, reject) =>
        childProcess.stderr
            .pipe(
                concat({ encoding: "string" }, result => {
                    if (isVerbose && result) {
                        console.debug(
                            `Error output for ${command} is:\n ${result}`
                        );
                    }
                    return resolve(result);
                })
            )
            .on("error", err => reject(err))
    );

    const exitPromise = new Promise((resolve, reject) =>
        childProcess.exitPromise.then(exitCode =>
            exitCode === 0 ? resolve() : reject(exitCode)
        )
    );

    return exitPromise.then(
        () => stdoutPromise, //exit code 0, returning stdout
        exitCode =>
            stderrPromise.then(
                //exit code !0, returning stderr
                errorMessage =>
                    Promise.reject(
                        `Child process failed with exit code ${exitCode}.\n${errorMessage}`
                    ),
                //exit code !0, returning error from gettings stderr
                errorMessage =>
                    Promise.reject(
                        `Child process failed with exit code ${exitCode}.\n${errorMessage}`
                    )
            )
    );
};
