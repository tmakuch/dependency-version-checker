module.exports = {
    command: "$0 [rule]",
    describe: "Check all git dependencies for updates",
    builder: {
        help: {
            hidden: true
        },
        version: {
            hidden: true
        },
        rule: {
            type: "string",
            description: "String regex that will be used to match dependency name",
            default: ".*"
        },
        verbose: {
            type: "boolean",
            description: "Printing a lot of debug data if set to true",
            default: false
        },
        showErrors: {
            type: "boolean",
            description: "Will show additional table with failed to check dependencies if set to true",
            default: false
        }
    }
};