//#!/usr/bin/env node

/**
 * Copyright 2016-2017 Francesco Camarlinghi
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
      log = require('debug')('cepy'),
      cepy = require('../cepy.js'),
      version = require('./package.json').version;

function handleError(error)
{
    console.error(error);
    process.exit(1);
};

function execute(mode, options)
{
    options.config = options.config || './cepy-config.js';
    log.enabled = log.enabled || options.verbose;
    let packager = cepy(require(path.resolve(options.config)));

    if (mode === 'decorate')
    {
        packager.decorate(options.buildName, options.debug)
        .then(process.exit)
        .catch(handleError);
    }
    else if (mode === 'launch')
    {
        packager.launch(options.buildName, { product: options.product, family: options.family, debug: options.debug })
        .then(process.exit)
        .catch(handleError);
    }
    else if (mode === 'pack')
    {
        packager.pack(options.debug)
        .then(process.exit)
        .catch(handleError);
    }
};

// Available commands
program
    .version(version);

program
    .command('decorate <buildName>')
    .alias('compile')
    .description('Generates manifest files (and, optionally, debug files) for the specified build.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Enables debug mode.')
    .option('--verbose', 'Optional. Enables verbose logging.')
    .action((buildName, options) =>
    {
        options = options || {};
        options.buildName = buildName;
        execute('decorate', options);
    });

program
    .command('launch <buildName>')
    .description('Decorates and launches the specified build, optionally in debug mode.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Enables debug mode.')
    .option('-p, --product', 'Optional. Name of the product that will be launched. Will fall back to the first product specified in the build.')
    .option('-f, --family', 'Optional. Name of the family of the product that will be launched. Will fall back to the first family specified in the build.')
    .option('--verbose', 'Optional. Enables verbose logging.')
    .action((buildName, options) =>
    {
        options = options || {};
        options.buildName = buildName;
        execute('launch', options);
    });

program
    .command('pack')
    .alias('package')
    .description('Decorates all the builds, optionally in debug mode, and then packages them into a redistributable ZXP archive.')
    .option('-c, --config <path>', 'Optional. Configuration file, defaults to "./cepy-config.js".')
    .option('-d, --debug', 'Optional. Enables debug mode.')
    .option('--verbose', 'Optional. Enables verbose logging.')
    .action((options) =>
    {
        execute('pack', options);
    });

program
	.command('*')
	.action(function (arg)
	{
	    // Catch-all for invalid commands
	    console.log(chalk.red(`Unknown command "${arg}".`));
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
