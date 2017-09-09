//#!/usr/bin/env node

/**
 * Copyright 2016 Francesco Camarlinghi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const program = require('commander'),
      chalk = require('chalk'),
      path = require('path'),
      cepy = require('../cepy.js'),
      version = require('./package.json').version;

function execute(mode, options)
{
    options.config = options.config || './cepy-config.js';
    let packager = cepy(require(path.resolve(options.config)));

    if (mode === 'compile')
    {
        packager.compile(options.buildName, options.output, options.debug)
        .then(process.exit)
        .catch(process.exit);
    }
    else if (mode === 'launch')
    {
        packager.launch(options.buildName, options.debug, options.product, options.family)
        .then(process.exit)
        .catch(process.exit);
    }
    else if (mode === 'release')
    {
        packager.release(options.debug)
        .then(process.exit)
        .catch(process.exit);
    }
};

// Available commands
program
    .version(version);

program
    .command('compile <buildName>')
    .description('Compiles the specified build to a folder. Generates manifest files and, optionally, debug files.')
    .option('-o, --output <path>', 'Output folder.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Compiles the build in debug mode.')
    .action((buildName, options) =>
    {
        options = options || {};
        options.buildName = buildName;
        execute('compile', options);
    });

program
    .command('launch <buildName>')
    .description('Compiles and launches the specified build, optionally in debug mode.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Compiles the build in debug mode.')
    .option('-p, --product', 'Optional. Name of the product that will be launched. Will fall back to the first product specified in the build.')
    .option('-f, --family', 'Optional. Name of the family of the product that will be launched. Will fall back to the first family specified in the build.')
    .action((buildName, options) =>
    {
        options = options || {};
        options.buildName = buildName;
        execute('launch', options);
    });

program
    .command('release')
    .alias('package')
    .description('Packages all the builds specified in the configuration file, optionally in debug mode.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Compiles the build in debug mode.')
    .action((options) =>
    {
        execute('release', options);
    });

program
	.command('*')
	.action(function (arg)
	{
	    // Catch-all for invalid commands
	    console.log(chalk.red(`Invalid command "${arg}".`));
	    program.help();
	    process.exit(1);
	});

// Let's go
program.parse(process.argv);

if (program.args.length === 0)
{
    // Show help if no command was specified
    program.help();
    process.exit(1);
}
