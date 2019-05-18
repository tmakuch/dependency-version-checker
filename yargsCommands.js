module.exports = {
    check: {
        command: "check [rule]",
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
                description:
                    "String regex that will be used to match dependency name",
                default: ".*"
            },
            "no-self-check": {
                type: "boolean",
                description: "Omits version check for this code"
            },
            "hide-next": {
                type: "boolean",
                description: "Hide entries that are up to date"
            },
            verbose: {
                type: "boolean",
                description: "Printing a lot of debug data"
            },
            "hide-errors": {
                type: "boolean",
                description: "Hide errors in the table"
            }
        }
    }
};
