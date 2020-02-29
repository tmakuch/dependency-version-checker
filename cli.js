#!/usr/bin/env node
const yargs = require("yargs");
yargs
    .help("help", "Use --help per each command to see command specific flags")
    .middleware(require("./src/packagePath.commandMiddleware"))
    .command(require("./src/check.command"))
    .command(require("./src/update.command"))
    .demandCommand(1, "You need to choose a command.");

// Workaround for invalid command. i.e. https://github.com/yargs/yargs/issues/287
const commands = yargs.getCommandInstance().getCommands();
const argv = yargs.argv;
if (!argv._[0] || commands.indexOf(argv._[0]) === -1) {
    console.log("No or invalid command specified.");
    yargs.showHelp();
    process.exit(1);
}