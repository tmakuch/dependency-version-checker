module.exports = {
    options: {
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
        "hide-error": {
            type: "boolean",
            description: "Hide errors in the table"
        },
        "include-prerelease": {
            type: "boolean",
            description: "Include x.y.z-something versions while checking versions"
        },
        silent: {
            type: "boolean",
            description: "Shows only table"
        },
        verbose: {
            type: "boolean",
            description: "Printing a lot of debug data"
        }
    }
};