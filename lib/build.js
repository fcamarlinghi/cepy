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
      exec = require('child_process').exec,
      cpy = require('cpy'),
      log = require('debug')('cepy'),
      uuid = require('uuid').v4;

const rimraf = Promise.promisify(require('rimraf')),
      fs_mkdir = Promise.promisify(require('fs').mkdir),
      fs_stat = Promise.promisify(require('fs').stat);

const defaultBuildConfig = require('../defaults/build.js'),
      defaultExtensionConfig = require('../defaults/extension.js'),
      defaultBundleConfig = require('../defaults/bundle.js'),
      bundleIdRegEx = /^[A-Za-z0-9._\-]+$/gi,
      bundleVersionRegEx = /^\d{1,9}(\.\d{1,9}(\.\d{1,9}(\.(\w|_|-)+)?)?)?$/gi;

const template = require('./template.js'),
      zxp = require('./zxp.js'),
      hosts = require('./hosts.js');

/**
 * Parses an array of product names.
 * @param {(String|String[])} names 
 */
function parseProducts(names)
{
    if (typeof names === 'string' && names.length > 0)
    {
        // Always return an array of products
        return [names.toLowerCase()];
    }
    else if (Array.isArray(names))
    {
        let result = [];
        for (const entry of names)
        {
            if (typeof entry === 'string' && entry.length > 0)
            {
                result.push(entry.toLowerCase());
            }
        }
        return result;
    }

    return [];
};

/**
 * Parses an array of family names.
 * @param {(String|String[])} names 
 */
function parseFamilies(names)
{
    if (typeof names === 'string')
    {
        // Minimum family
        return names.toLowerCase();
    }
    else if (Array.isArray(names))
    {
        let result = [];
        for (const entry of names)
        {
            if (typeof entry === 'string' && entry.length > 0)
            {
                result.push(entry.toLowerCase());
            }
        }

        // Sort array alphabetically
        // Useful for families so they're guaranteed to go from lower to higher
        // i.e. [CC2015, CC, CC2014] -> [CC, CC2014, CC2015]
        result.sort();
        return result;
    }

    return [];
};

/**
 * A build that should be executed as part of packaging/debug process.
 * @class
 * @param {String} name
 * @param {Object} config
 */
function Build(name, config)
{
    _.defaultsDeep(config, _.cloneDeep(defaultBuildConfig));

    let bundle = (typeof config.bundle === 'object') ? config.bundle : {},
        extensions = config.extensions,
        products = parseProducts(config.products),
        families = parseFamilies(config.families);

    // Extensions
    if (!Array.isArray(extensions))
    {
        if (typeof extensions === 'object')
        {
            extensions = [extensions];
        }
        else
        {
            extensions = [];
        }
    }

    Object.defineProperties(this, {

        /** Build name. */
        name: { value: name, enumerable: true },

        /** Build source folder. */
        source: { value: config.source, enumerable: true },

        /** Bundle manifest. */
        bundle: { value: bundle, enumerable: true },

        /** Extension manifests. */
        extensions: { value: extensions, enumerable: true },

        /** Products to build the bundle for. */
        products: { value: products, enumerable: true },

        /** Families to build the bundle for. */
        families: { value: families, enumerable: true },

        /** Bundle name stripped out of potentially dangerous characters. */
        baseName: { value: '', writable: true, enumerable: true },

        /** Unique name for the output ZXP package for this build. */
        outputFile: { value: `${uuid()}.zxp` },
        
        /** Whether the build has been initialized. */
        initialized: { value: false, writable: true },

    });
};

Build.prototype = Object.create(null);
Build.constructor = Build;

/**
 * Performs basic validation and initialization of the build.
 * @private
 */
Build.prototype._initialize = function ()
{
    if (this.initialized)
    {
        return;
    }

    return Promise
    .try(() =>
    {
        if (this.extensions.length === 0)
        {
            throw new Error('No extensions specified.');
        }

        // Make sure information is complete for each extension
        for (let i = 0; i < this.extensions.length; i++)
        {
            _.defaultsDeep(this.extensions[i], _.cloneDeep(defaultExtensionConfig));
        }

        // Make sure bundle information is complete and valid
        _.defaultsDeep(this.bundle, _.cloneDeep(defaultBundleConfig));
        _.extendWith(this.bundle, _.pick(this.extensions[0], 'id', 'version', 'name', 'author'), (a, b) => { return (typeof a === 'string' && a.length > 0) ? a : b; });

        if (typeof this.bundle.id !== 'string' || this.bundle.id.length === 0 || !bundleIdRegEx.test(this.bundle.id))
        {
            throw new Error(`Invalid bundle id "${this.bundle.id}" in build "${this.name}"`);
        }

        if (typeof this.bundle.version !== 'string' || this.bundle.version.length === 0 || !bundleVersionRegEx.test(this.bundle.version))
        {
            throw new Error(`Invalid bundle version "${this.bundle.version}" in build "${this.name}"`);
        }

        if (typeof this.bundle.name !== 'string' || this.bundle.name.length === 0)
        {
            throw new Error(`Invalid bundle name "${this.bundle.name}" in build "${this.name}"`);
        }

        if (typeof this.bundle.author !== 'string' || this.bundle.author.length === 0)
        {
            throw new Error(`Invalid bundle author "${this.bundle.author}" in build "${this.name}"`);
        }

        this.baseName = this.bundle.id.replace(/[\s]+/g, '_').toLowerCase();

        // Make sure to have valid products and families
        if (this.products.length === 0)
        {
            throw new Error(`No products specified in build "${this.name}".`);
        }

        if (this.families.length === 0)
        {
            throw new Error(`No families specified in build "${this.name}".`);
        }

        // Check source folder
        return fs_stat(this.source).catch(() =>
        {
            throw new Error(`Invalid source folder ${path.resolve(this.source)} in build "${this.name}".`);
        });
    })
    .then(() =>
    {
        this.initialized = true;
    });;
};

/**
 * Generates manifest files and, optionally, debug files.
 * @param {Boolean} debug
 * @returns {Promise}
 */
Build.prototype.decorate = function (debug)
{
    log(`Decorating ${chalk.green(this.name)} in ${(debug) ? chalk.yellow('debug') : chalk.green('release')} mode...`);

    return Promise

    // Build initialization
    .try(() => this._initialize())

    // Append debug flag to bundle and extensions info and generate .debug file
    .then(() =>
    {
        if (debug)
        {
            this.bundle.id = `${this.bundle.id}.debug`;
            this.bundle.name = `${this.bundle.name} (debug)`;

            for (let extension of this.extensions)
            {
                extension.id = `${extension.id}.debug`;

                if (extension.name)
                {
                    extension.name = `${extension.name} (debug)`;
                }
            }

            return template.generateDotDebug(this.source, this);
        }
    })

    // Generate bundle manifest
    .then(() => { return template.generateBundleManifest(this.source, this) })

    .tap(() => log(`Build ${chalk.green(this.name)} decorated successfully.`));
};

/**
 * Packages this build.
 * @param {String} stagingFolder
 * @param {Object} packaging
 * @returns {Promise}
 */
Build.prototype.pack = function (stagingFolder, packaging)
{
    return Promise

    // Build initialization
    .try(() => this._initialize())

    // Generate ZXP package for this build
    .then(() => { return zxp.createPackage(this.source, path.join(stagingFolder, this.outputFile), packaging); });
};

/**
 * Launches this build in the specified host application.
 * @param {String} [product] Name of the product to launch.
 * @param {String} [family] Version of the product to launch.
 * @returns {Promise}
 */
Build.prototype.launch = function (product, family)
{
    let options = {
        host: null,
        productBinary: '',
        installFolder: '',
    };

    const isWindows = !!process.platform.match(/^win/);

    return Promise

    // Build initialization
    .try(() => this._initialize())

    // Detect launch options
    .then(() =>
    {
        // Get product and family
        if (typeof product === 'string' && product.length > 0)
        {
            product = product.toLowerCase();

            if (!this.products.find(product))
            {
                throw new Error(`Could not find product "${product}" in build "${this.name}", aborting launch.`);
            }
        }
        else
        {
            product = this.products[0];
            log(chalk.yellow(`No product specified, falling back to first one: "${product}".`))
        }

        if (typeof family === 'string' && family.length > 0)
        {
            family = family.toLowerCase();
        }
        else
        {
            family = Array.isArray(this.families) ? this.families[0] : this.families;
            log(chalk.yellow(`No family specified, falling back to first one: "${family}".`))
        }

        // Get host
        options.host = hosts.getProduct(product, family);
    })

    // Get path to install folder
    .then(() =>
    {
        if (isWindows)
        {
            if (family === 'cc')
            {
                return path.join(process.env['APPDATA'], '/Adobe/CEPServiceManager4/extensions');
            }
            else
            {
                return path.join(process.env['APPDATA'], '/Adobe/CEP/extensions');
            }
        }
        else
        {
            let serviceMgrFolder;

            if (family === 'cc')
            {
                serviceMgrFolder = path.join(process.env['HOME'], '/Library/Application Support/Adobe/CEPServiceManager4/extensions');
            }
            else
            {
                serviceMgrFolder = path.join(process.env['HOME'], '/Library/Application Support/Adobe/CEP/extensions');
            }

            // Fallback to system folder if user folder doesn't exist
            return fs_stat(serviceMgrFolder)
            .then(() => { return serviceMgrFolder; })
            .catch(() =>
            {
                if (family === 'cc')
                {
                    return '/Library/Application Support/Adobe/CEPServiceManager4/extensions';
                }
                else
                {
                    return '/Library/Application Support/Adobe/CEP/extensions';
                }
            });
        }
    })

    .then((serviceMgrFolder) =>
    {
        return fs_stat(path.join(this.source, '.debug'))
        .then(() =>
        {
            options.installFolder = path.join(serviceMgrFolder, `${this.baseName}.debug`);
        })
        .catch(() =>
        {
            options.installFolder = path.join(serviceMgrFolder, this.baseName);
        });
    })

    // Application binary
    .then(() =>
    {
        let productFolder;

        if (isWindows)
        {
            productFolder = path.join(process.env['PROGRAMFILES'], '/Adobe');
        }
        else
        {
            productFolder = '/Applications';
        }

        if (options.host.hasOwnProperty('folder'))
        {
            productFolder = path.join(productFolder, options.host.folder);
        }
        else
        {
            const familyFolder = (family === 'cc') ? 'CC' : `CC ${family.substr(2)}`;
            productFolder = path.join(productFolder, `/Adobe ${options.host.name} ${familyFolder}`);
        }

        // On Windows X64, CC apps have " (64 Bit)" added to their folder path if they are installed with 64bit support
        // This is no longer the case starting from CC2014
        if (family === 'cc' && options.host.x64 && isWindows && process.arch === 'x64')
        {
            productFolder += ' (64 Bit)';
        }

        options.productBinary = path.join(productFolder, (isWindows) ? options.host.bin.win : options.host.bin.mac);

        // Check product executable path
        return fs_stat(options.productBinary).catch(() =>
        {
            throw new Error(`Unable to find "Adobe ${options.host.name}" executable at "${options.productBinary}" for build "${this.name}".`);
        });
    })

    // Install and start
    // Kill the specified host application process if it is running
    .then(() =>
    {
        const fullname = `Adobe ${options.host.name} ${family.toUpperCase()}`;
        log(`Killing ${chalk.green(fullname)} process`);

        return new Promise((resolve, reject) =>
        {
            let cmd;

            if (isWindows)
            {
                cmd = `Taskkill /IM ${path.basename(options.productBinary)}`;
            }
            else
            {
                cmd = `killall ${options.host.bin.mac.slice(0, -4)}`;
            }

            log(chalk.green(cmd));
            exec(cmd, (error, stdout, stderr) =>
            {
                if (error === null || error.code === 0)
                {
                    // Let some time pass so that application can be closed correctly
                    // TODO: find a better way of doing this
                    setTimeout(() => resolve(), 1000);
                }
                else
                {
                    reject(`An error occurred while killing the host application process: ${error}`);
                }
            });
        });
    })

    // Set "PlayerDebugMode" flag in plist file or Windows registry
    .then(() =>
    {
        log('Setting OS debug mode...');

        // CC 2015.5 contains a mix of CEP 6 and CEP 7 so we need to set flags for both
        var parsedFamilies = [family];
        if (parsedFamilies[0] === 'cc2015.5')
        {
            parsedFamilies.push('cc2015');
        }

        return Promise.map(parsedFamilies, family =>
        {
            return new Promise((resolve, reject) =>
            {
                // REVIEW: move plists to hosts.js?
                let plists, cmd;

                if (isWindows)
                {
                    plists = {
                        'cc': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.4\\',
                        'cc2014': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.5\\',
                        'cc2015': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.6\\',
                        'cc2015.5': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.7\\',
                        'cc2017': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.7\\',
                        'cc2018': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.8\\',
                        'cc2019': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.9\\',
                        'cc2020': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.9\\',
                        'CC2021': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.10\\',
                        'CC2022': 'HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.11\\',
                    };

                    if (!plists.hasOwnProperty(family))
                    {
                        resolve();
                        return;
                    }

                    cmd = `reg add ${plists[family]} /v PlayerDebugMode /d 1 /f`;
                }
                else
                {
                    plists = {
                        'cc': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.4.plist'),
                        'cc2014': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.5.plist'),
                        'cc2015': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.6.plist'),
                        'cc2015.5': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.7.plist'),
                        'cc2017': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.7.plist'),
                        'cc2018': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.8.plist'),
                        'cc2019': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.9.plist'),
                        'cc2020': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.9.plist'),
                        'CC2021': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.10.plist'),
                        'CC2022': path.join(process.env['HOME'], '/Library/Preferences/com.adobe.CSXS.11.plist'),
                    };

                    if (!plists.hasOwnProperty(family))
                    {
                        resolve();
                        return;
                    }

                    cmd = `defaults write ${plists[family]} PlayerDebugMode 1`;
                }

                log(chalk.green(cmd));
                exec(cmd, (error, stdout, stderr) =>
                {
                    if (error === null || error.code === 0)
                    {
                        if (isWindows)
                        {
                            resolve();
                        }
                        else
                        {
                            // Flush preference cache to support Mac OS X 10.9 and higher
                            cmd = 'pkill -9 cfprefsd';
                            log('Flushing preference cache...');
                            log(chalk.green(cmd));
                            exec(cmd, (error, stdout, stderr) => resolve());
                        }
                    }
                    else
                    {
                        reject(`An error occurred while setting debug flags: ${error}`);
                    }
                });
            });
        });
    })

    // Install extension by copying files to the 'extensions' folder
    .then(() =>
    {
        log(`Installing extension at ${chalk.cyan(options.installFolder)}...`);

        return rimraf(options.installFolder)
        .then(() => { return fs_mkdir(options.installFolder, { recursive: true}); })
        .then(() => { return cpy(['**/*.*'], path.resolve(destination), { cwd: this.source, parents: true }); })
        .then(() => { return cpy(['**/.*'], path.resolve(destination), { cwd: this.source, parents: true }); });
    })

    // Launch the specified host application
    .then(() =>
    {
        const fullname = `Adobe ${options.host.name} ${family.toUpperCase()}`;
        log(`Launching ${chalk.green(this.name)} in ${chalk.green(fullname)}...`);

        if (isWindows)
        {
            exec(`explorer.exe "${options.productBinary}"`);
        }
        else
        {
            exec(`open -F -n "${options.productBinary}"`);
        }
    });
};

module.exports = Build;
