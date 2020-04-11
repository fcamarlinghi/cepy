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

const _ = require('lodash'),
      chalk = require('chalk'),
      Promise = require('bluebird'),
      path = require('path'),
      log = require('debug')('cepy'),
      cpy = require('cpy');

const rimraf = Promise.promisify(require('rimraf')),
      fs_mkdir = Promise.promisify(require('fs').mkdir),
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
 * Generates manifest files (and, optionally, debug files) for the specified build.
 * @param {String} buildName Name of the build that should be decorated.
 * @param {Boolean} [debug=false] Whether to decorate the build in "debug" mode.
 * @returns {Promise} A promise that resolves once the build has been decorated.
 */
Cepy.prototype.decorate = function (buildName,  debug)
{
    log(chalk.bold('Running cepy in "decorate" mode.'));

    return Promise

    // Compile the specified build
    .try(() =>
    {
        const build = this._builds.find(build => build.name === buildName);

        if (build)
        {
            return build.decorate(!!debug);
        }
        else
        {
            throw new Error(`No build with the specified name could be found: ${buildName}.`);
        }
    });

};

/**
 * Launches the specified build.
 * @param {String} buildName Name of the build that should be launched.
 * @param {Object} [options] Launch options.
 * @param {String} [options.product] Name of the product to launch. Defaults to the first product in build if not specified.
 * @param {String} [options.family] Version of the product to launch. Defaults to the first family in build if not specified.
 * @param {Boolean} [options.decorate=true] Whether to decorate the build prior to launch.
 * @param {Boolean} [options.debug=false] Whether to launch the build in "debug" mode.
 * @returns {Promise} A promise that resolves once the build has been launched.
 */
Cepy.prototype.launch = function (buildName, options)
{
    log(chalk.bold('Running cepy in "launch" mode.'));
    
    options = _.defaults({
        product: null,
        family: null,
        decorate: true,
        debug: false,
    }, options || {});

    return Promise

    // Config validation
    .try(() =>
    {
        if (typeof this._packaging.staging !== 'string' || this._packaging.staging.length === 0)
        {
            throw new Error(`Invalid staging folder path: ${this._packaging.staging}.`);
        }

        if (this._builds.size === 0)
        {
            throw new Error('No builds are currently defined in configuration file.');
        }

        // Find build
        let build = this._builds.find(build => build.name === buildName);

        if (!build)
        {
            throw new Error(`No build with the specified name could be found: ${buildName}.`);
        }

        return build;
    })

    // Decorate
    .tap((build) =>
    {
        if (options.decorate)
        {
            return build.decorate(!!options.debug);
        }
    })

    // Launch
    .then((build) =>
    {
        return build.launch(options.product, options.family, !!options.debug);
    });
};

/**
 * Packages all the builds and files to a single ZXP archive.
 * @param {Object} [options] Pack options.
 * @param {Boolean} [options.decorate=true] Whether to decorate the builds prior to packaging.
 * @param {Boolean} [options.debug=false] Whether to pack in "debug" mode.
 * @returns {Promise} A promise that resolves once the ZXP package has been created.
 */
Cepy.prototype.pack = function (options)
{
    log(chalk.bold('Running cepy in "package" mode.'));
    
    options = _.defaults({
        decorate: true,
        debug: false,
    }, options || {});

    return Promise

    // Config validation
    .try(() =>
    {
        if (typeof this._packaging.output !== 'string' || this._packaging.output.length === 0)
        {
            throw new Error(`Invalid output file name: ${this._packaging.output}.`);
        }

        if (typeof this._packaging.staging !== 'string' || this._packaging.staging.length === 0)
        {
            throw new Error(`Invalid staging folder path: ${this._packaging.staging}.`);
        }
    })

    // Create output directory structure
    .then(() => { return rimraf(path.join(this._packaging.staging, '/*')); })
    .then(() => { return fs_mkdir(this._packaging.staging, { recursive: true }); })

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
        if (options.decorate)
        {
            return Promise.map(this._builds, (build) => build.decorate(options.debug));
        }
    })
    .then(() =>
    {
        return Promise.map(this._builds, (build) => build.pack(this._packaging.staging, this._packaging));
    })

    // Generate MXI file
    .then(() => { return template.generateMXI(this._packaging.staging, this._builds, this._packaging); })

    // Copy additional files to the bundle
    .then(() =>
    {
        // We need to resolve the path to the staging folder to obtain an absolute path to avoid
        // issues in case the user specifies a different working directory in the "files" array
        const stagingResolved = path.resolve(this._packaging.staging);

        if (Array.isArray(this._packaging.files))
        {
            const copies = [];
            for (const file of this._packaging.files)
            {
                if (typeof file === 'string' && file.length > 0)
                {
                    copies.push(cpy(file, stagingResolved));
                }
                else
                {
                    copies.push(cpy(file.source, stagingResolved, file.options));
                }
            }
            return Promise.all(copies);
        }
        else if (typeof this._packaging.files === 'string' && this._packaging.files.length > 0)
        {
            return cpy(this._packaging.files, stagingResolved);
        }
    })

    // Package hybrid extension
    .then(() =>
    {
        return zxp.createPackage(this._packaging.staging, this._packaging.output, this._packaging);
    })

    .tap(() => log(`Package ${chalk.green(path.resolve(this._packaging.output))} created successfully.`))

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
