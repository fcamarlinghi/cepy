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
      path = require('path'),
      exec = require('child_process').exec,
      cpy = require('cpy'),
      uuid = require('node-uuid').v4;

const rimraf = Promise.promisify(require('rimraf')),
      mkdirp = Promise.promisify(require('mkdirp')),
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
 * A build that should be executed as part of packaging/debug process.
 */
function Build(name, config)
{
    _.defaultsDeep(config, _.cloneDeep(defaultBuildConfig));

    let bundle = config.bundle,
        extensions = config.extensions,
        products = config.products,
        families = config.families;

    // Bundle
    if (typeof bundle !== 'object')
    {
        bundle = {};
    }

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

    // Product
    if (typeof products === 'string' && products.length > 0)
    {
        products = [products];
    }

    if (Array.isArray(products))
    {
        for (let i = 0; i < products.length; i++)
        {
            if (typeof products[i] === 'string' && products[i].length > 0)
            {
                products[i] = products[i].toLowerCase();
            }
            else
            {
                products.splice(i--, 1);
            }
        }

        products.sort();
    }
    else
    {
        products = [];
    }

    // Families
    if (typeof families === 'string' && families.length > 0)
    {
        families = [families];
    }

    if (Array.isArray(families))
    {
        for (let i = 0; i < families.length; i++)
        {
            if (typeof families[i] === 'string' && families[i].length > 0)
            {
                families[i] = families[i].toLowerCase();
            }
            else
            {
                products.splice(i--, 1);
            }
        }

        // Sort families alphabetically so they go from lower to higher
        // i.e. [CC2015, CC, CC2014] -> [CC, CC2014, CC2015]
        families.sort();
    }
    else
    {
        families = [];
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
        outputFile: { value: `${uuid()}.zxp` }

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
    return Promise.bind(this)
    .then(() =>
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
    });
};

/**
 * Compiles this build to the specified destination folder. Generates manifest files and, optionally, debug files.
 */
Build.prototype.compile = function (destination, debug)
{
    // Build initialization
    return Promise.bind(this)
    .then(() => console.log(`\nCompiling ${chalk.green(this.name)} in ${(debug) ? chalk.yellow('debug') : chalk.green('release')} mode.`))
    .then(this._initialize)

    // Make sure destination folder is valid
    .then(() =>
    {
        if (typeof destination !== 'string' || destination.length === 0)
        {
            throw new Error(`Invalid destination folder: ${destination}`);
        }

        // Support generating manifest file in-place
        if (path.resolve(this.source).toLowerCase() === path.resolve(destination).toLowerCase())
        {
            console.log(`Manifest files will be generated in-place, in ${chalk.cyan(path.resolve(destination))}.`);
            return mkdirp(destination);
        }
        else
        {
            console.log(`Manifest files will be generated in ${chalk.cyan(path.resolve(destination))}.`);

            return rimraf(destination)
            .then(() => { return mkdirp(destination) })
            .then(() =>
            {
                // Copy all extension files to destination folder
                console.log(`Copying bundle files from ${chalk.cyan(path.resolve(this.source))}`);
                return cpy(['**/*.*'], path.resolve(destination), { cwd: this.source, parents: true });
            });
        }
    })

    // Append debug flag to bundle and extensions info and generate .debug file
    .then(() =>
    {
        if (debug)
        {
            this.bundle.id = `${this.bundle.id}.debug`;
            this.bundle.name = `${this.bundle.name} (debug)`;
            this.extensions.forEach((extension) =>
            {
                extension.id = `${extension.id}.debug`;
                extension.name = `${extension.name} (debug)`;
            });

            return template.generateDotDebug(destination, this);
        }
    })

    // Generate bundle manifest
    .then(() => { return template.generateBundleManifest(destination, this) })

    .then(() => console.log(`${chalk.green(this.name)} compiled successfully.`));
};

/**
 * Packages this build.
 */
Build.prototype.release = function (stagingFolder, debug, packaging)
{
    // Temp directory that will be used to compile this build
    const tempFolder = path.join(stagingFolder, 'temp');

    return Promise.bind(this)

    // Compile the build to temp directory (also takes care of initialization)
    .then(() =>
    {
        return this.compile(tempFolder, debug);
    })

    // Compile ZXP package for this build
    .then(() => { return zxp.createPackage(tempFolder, path.join(stagingFolder, this.outputFile), packaging, debug); })

    // Remove destination directory
    .finally(() => { return rimraf(tempFolder) });
};

/**
 * Launches this build in the specified host application.
 */
Build.prototype.launch = function (stagingFolder, debug, product, family)
{
    let options = {
        host: null,
        productBinary: '',
        installFolder: '',
    };

    const isWindows = !!process.platform.match(/^win/);

    return Promise.bind(this)

    // Compile the build to temp directory (also takes care of initialization)
    .then(() =>
    {
        return this.compile(stagingFolder, debug);
    })

    // Detect launch options
    .then(() =>
    {
        // Find product and family
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
            console.log(chalk.yellow(`No product specified, falling back to first one: "${product}".`))
        }

        if (typeof family === 'string' && family.length > 0)
        {
            family = family.toLowerCase();

            if (!this.families.find(family))
            {
                throw new Error(`Could not find family "${family}" in build "${this.name}", aborting launch.`);
            }
        }
        else
        {
            family = this.families[0];
            console.log(chalk.yellow(`No family specified, falling back to first one: "${family}".`))
        }

        // Get host
        options.host = hosts.getProduct(product, family);
    })

    // Get path to install folder
    .then(() =>
    {
        if (isWindows)
        {
            if (family === 'CC')
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

            if (family === 'CC')
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
                if (family === 'CC')
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
        options.installFolder = path.join(serviceMgrFolder, this.baseName);

        if (debug)
        {
            options.installFolder += '.debug';
        }
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
            const familyFolderMap = {
                'CC': 'CC',
                'CC2014': 'CC 2014',
                'CC2015': 'CC 2015',
                'CC2015.5': 'CC 2015.5',
            };

            productFolder = path.join(productFolder, `/Adobe ${options.host.name} ${familyFolderMap[family]}`);
        }

        // On Windows X64, CC apps have " (64 Bit)" added to their folder path if they are installed with 64bit support
        // This is no longer the case starting from CC2014
        if (family === 'CC' && options.host.x64 && isWindows && process.arch === 'x64')
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
        console.log(`Killing ${chalk.green(fullname)} process`);

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

            // TODO: verbose
            // chalk.green(cmd)
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
                    console.log(chalk.red(stdout));
                    console.log(chalk.red(stderr));
                    reject('An error occurred while killing the host application process.');
                }
            });
        });
    })

    // Set "PlayerDebugMode" flag in plist file or Windows registry
    .then(() =>
    {
        console.log('Setting OS debug mode');

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
                    };

                    if (!plists.hasOwnProperty(family))
                    {
                        resolve();
                        return;
                    }

                    cmd = `defaults write ${plists[family]} PlayerDebugMode 1`;
                }

                // TODO: verbose
                // chalk.green(cmd)
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
                            console.log('Flushing preference cache');
                            // TODO: verbose
                            // chalk.green(cmd)

                            exec(cmd, (error, stdout, stderr) => resolve());
                        }
                    }
                    else
                    {
                        console.log(chalk.red(stdout));
                        console.log(chalk.red(stderr));
                        reject('An error occurred while setting debug flags.');
                    }
                });
            });
        });
    })

    // Install extension by copying files to the 'extensions' folder
    .then(() =>
    {
        console.log(`Installing extension at ${chalk.cyan(options.installFolder)}`);

        return rimraf(options.installFolder)
        .then(() => { return mkdirp(options.installFolder) })
        .then(() => { return cpy(['**/*.*'], path.resolve(destination), { cwd: stagingFolder, parents: true }); })
        .then(() => { return cpy(['**/.*'], path.resolve(destination), { cwd: stagingFolder, parents: true }); });
    })

    // Launch the specified host application
    .then(() =>
    {
        const fullname = `Adobe ${options.host.name} ${family.toUpperCase()}`;
        console.log(`Launching ${chalk.green(this.name)} in ${chalk.green(fullname)}`);

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
