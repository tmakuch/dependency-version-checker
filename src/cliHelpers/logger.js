const ora = require("ora");

module.exports = options => ({
    debug: (...args) =>
        !options.silent && options.verbose && console.debug(...args),
    log: (...args) => !options.silent && console.log(...args),
    error: (...args) => !options.silent && console.error(...args),
    childError: (...args) =>
        !options.silent && options.verbose && console.error(...args),
    spinner: !options.silent
        ? ora({
              spinner: "line",
              color: "green"
          })
        : null
});
