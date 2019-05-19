#!/usr/bin/env node
return require("yargs")
    .help("help", "Use --help per each command to see command specific flags")
    .middleware(require("./src/packagePath.commandMiddleware"))
    .command(require("./src/check.command"))
    .demandCommand(1, "You need to choose a command.")
    .argv;


