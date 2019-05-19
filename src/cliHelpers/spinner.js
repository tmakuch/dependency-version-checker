const ora = require("ora");

module.exports = options => ora(Object.assign({
    spinner: "line",
    color: "green"
}, options));
