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

const _ = require('lodash'),
      chalk = require('chalk'),
      Promise = require('bluebird'),
      path = require('path');

const rimraf = Promise.promisify(require('rimraf')),
      mkdirp = Promise.promisify(require('mkdirp')),
      fs_stat = Promise.promisify(require('fs').stat);

const template = require('./lib/template.js'),
      Build = require('./lib/build.js'),
      zxp = require('./lib/zxp.js');

const defaultConfig = require('./defaults/config.js');

/**
 * Main application.
 */
function Cepy(config)
{
    if (!(this instanceof Cepy))
    {
        return new Cepy(config);
    }

    // Make sure config information is at least valid for first initialization
    if (typeof config === 'object')
    {
        config = _.defaultsDeep(_.cloneDeep(config), _.cloneDeep(defaultConfig));
    }
    else
    {
        config = _.cloneDeep(defaultConfig);
    }

    // Load builds
    let builds = [];
    Object.keys(config.builds).forEach((buildName) =>
    {
        builds.push(new Build(buildName, config.builds[buildName]));
    });

    Object.defineProperties(this, {

        /** Builds. */
        _builds: { value: builds },

        /** Packaging. */
        _packaging: { value: config.packaging },

    });
};

Cepy.prototype = Object.create(null);
Cepy.constructor = Cepy;

/**
 * Compiles the specified build to a folder. Generates manifest files and, optionally, debug files.
 */
Cepy.prototype.compile = function (buildName, outputFolder, debug)
{
    console.log(chalk.bold('Running cepy in "compile" mode'));

    return Promise.bind(this)

    // Compile the specified build
    .then(() =>
    {
        const build = this._builds.find(build => build.name === buildName);

        if (build)
        {
            return build.compile(outputFolder, !!debug);
        }
        else
        {
            throw new Error(`No build with the specified name could be found: ${buildName}`);
        }
    })

    .catch(error =>
    {
        console.log(chalk.red(error));
        throw error;
    });

};

/**
 * Compiles and launches the specified build.
 */
Cepy.prototype.launch = function (buildName, debug, product, family)
{
    console.log(chalk.bold('Running cepy in "launch" mode'));

    return Promise.bind(this)

    // Config validation
    .then(() =>
    {
        console.log('Validating options');

        if (typeof this._packaging.staging !== 'string' || this._packaging.staging.length === 0)
        {
            throw new Error(`Invalid staging folder path: ${this._packaging.staging}`);
        }

        if (this._builds.size === 0)
        {
            throw new Error('No builds are currently defined in configuration file.');
        }

        // Find build
        let build = this._builds.find(build => build.name === buildName);

        if (!build)
        {
            throw new Error(`No build with the specified name could be found: ${buildName}`);
        }

        return build;
    })

    // Launch
    .then((build) =>
    {
        return build.launch(this._packaging.staging, !!debug);
    })

    .catch(error =>
    {
        console.log(chalk.red(error));
        throw error;
    });
};

/**
 * Compiles all the builds and files to a single ZXP package.
 */
Cepy.prototype.release = function (debug)
{
    console.log(chalk.bold('Running cepy in "release" mode'));

    return Promise.bind(this)

    // Config validation
    .then(() =>
    {
        if (typeof this._packaging.output !== 'string' || this._packaging.output.length === 0)
        {
            throw new Error(`Invalid output file name: ${this._packaging.output}`);
        }

        if (typeof this._packaging.staging !== 'string' || this._packaging.staging.length === 0)
        {
            throw new Error(`Invalid staging folder path: ${this._packaging.staging}`);
        }
    })

    // Create output directory structure
    .then(() => { return rimraf(path.join(this._packaging.staging, '/*')); })
    .then(() => { return mkdirp(this._packaging.staging); })

    // Check certificate file, create one if none exists
    .then(() =>
    {
        return fs_stat(this._packaging.certificate.file)
        .catch(() => { return zxp.generateCertificate(this._packaging.certificate); })
        .catch((error) => { throw error });
    })

    // Execute all builds
    .then(() =>
    {
        return Promise.map(this._builds, (build) =>
        {
            return build.release(this._packaging.staging, !!debug, this._packaging);
        });
    })

    // Generate MXI file
    .then(() => { return template.generateMXI(this._packaging.staging, this._builds, this._packaging); })

    // Package hybrid extension
    .then(() =>
    {
        return zxp.createPackage(this._packaging.staging, this._packaging.output, this._packaging, debug);
    })

    .then(() => console.log(`Package ${chalk.green(path.resolve(this._packaging.output))} created successfully.`))

    .catch(error =>
    {
        console.log(chalk.red(error));
        throw error;
    })

    // Cleanup staging folder
    .finally(() =>
    {
        if (this._packaging.staging)
        {
            return rimraf(this._packaging.staging);
        }
    });
};

module.exports = Cepy;
