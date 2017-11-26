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

const path = require('path'),
      Promise = require('bluebird'),
      chalk = require('chalk'),
      _ = require('lodash');

const mkdirp = Promise.promisify(require('mkdirp')),
      fs_readFile = Promise.promisify(require('fs').readFile),
      fs_writeFile = Promise.promisify(require('fs').writeFile);

const hosts = require('./hosts.js');

// Custom delimiters that play nice with XML templates
const templateOptions = {
    interpolate: /{%=([\s\S]+?)%}/g,
    evaluate: /{%([\s\S]+?)%}/g,
    escape: /{%-([\s\S]+?)%}/g,
};

/**
 * Creates a .debug file from template.
 */
const generateDotDebug = function (outputPath, build)
{
    console.log(`Generating ${chalk.cyan('.debug')} file`);
    const debugConfig = build.bundle.debug;

    if (typeof debugConfig.port !== 'number' || debugConfig.port < 0)
    {
        throw new Error(`Invalid host debug port ${chalk.cyan(debugConfig.port)}.`);
    }

    // Process template
    let templatePath = debugConfig.template;
    if (typeof templatePath !== 'string' || templatePath.length === 0)
    {
        // Fall back to a default template if none is specified in extension properties
        templatePath = path.resolve(__dirname, '../res/.debug');
    }

    return Promise
    .resolve(fs_readFile(templatePath))
    .then(template =>
    {
        const dotdebug = _.template(template, templateOptions)(build);
        return fs_writeFile(path.join(outputPath, '.debug'), dotdebug)
        .catch(error => { throw new Error(`Could not write .debug file: ${error}.`); });
    });
};

/**
 * Creates a CSXS manifest file from template.
 */
const generateBundleManifest = function (outputPath, build)
{
    let HostList = [],
        ExtensionList = [],
        DispatchInfoList = [];

    // TODO: verbose
    console.log('Generating bundle manifest');

    return Promise.resolve()

    // Generate manifest data for each extension
    .then(() =>
    {
        return Promise.map(build.extensions, extension =>
        {
            // Add this extension to bundle extension list
            ExtensionList.push(`<Extension Id="${extension.id}" Version="${extension.version}" />`);

            // Build manifest data for this extension and add it to DispatchInfoList
            let templatePath = extension.manifest;
            if (typeof templatePath !== 'string' || !templatePath.length)
            {
                // Fall back to a default template if none is specified in extension properties
                templatePath = path.join(__dirname, '../res/manifest.extension.xml');
            }

            return fs_readFile(templatePath, 'utf8')
            .then(template =>
            {
                const extensionManifest = _.template(template, templateOptions)(extension);
                DispatchInfoList.push(extensionManifest)
            })
            .catch(() => { throw new Error(`Unable to produce manifest data for extension "${chalk.cyan(extension.id)}".`) });
        });
    })

    // Generate bundle manifest
    .then(() =>
    {
        // <Host> list
        if (Array.isArray(build.products))
        {
            build.products.forEach(product =>
            {
                const hostInfo = hosts.getProduct(product, build.families[0]),
                      hostVersionRange = hosts.getVersionRange(product, build.families);

                for (let i = 0; i < hostInfo.ids.length; i++)
                {
                    HostList.push(`<Host Name="${hostInfo.ids[i]}" Version="[${hostVersionRange.min.toFixed(1)},${hostVersionRange.max.toFixed(1)}]" />`);
                }
            });
        }

        // Process template
        let templatePath = build.bundle.manifest;
        if (typeof templatePath !== 'string' || templatePath.length === 0)
        {
            // Fall back to a default template if none is specified in bundle properties
            // As families are sorted alphabetically (@see build.js), the first one
            // is guaranteed to be the lowest we need to support
            templatePath = path.resolve(__dirname, `../res/manifest.bundle.${build.families[0]}.xml`);
        }

        return fs_readFile(templatePath, 'utf8')
        .then(template =>
        {
            const data = {
                bundle: build.bundle,
                HostList: HostList.join('\r\n\t\t\t'),
                ExtensionList: ExtensionList.join('\r\n\t\t\t'),
                DispatchInfoList: DispatchInfoList.join('\r\n\t\t\t'),
            };

            const bundleManifest = _.template(template, templateOptions)(data);

            // Make sure CSXS folder exists in output folder
            return mkdirp(path.join(outputPath, 'CSXS'))
            .then(() => fs_writeFile(path.join(outputPath, 'CSXS/manifest.xml'), bundleManifest));
        })
        .catch(error => { throw new Error(`Unable to produce bundle manifest: ${error}`); });
    });
};

/**
 * Populates extension MXI file template.
 */
const generateMXI = function (outputPath, builds, packaging)
{
    // Use bundle information from the first build
    const mxiFilename = `${builds[0].baseName}.mxi`;
    console.log(`\nGenerating ${chalk.cyan(mxiFilename)} file from template`);

    let hostVersions = {},
        FileList = [],
        ProductList = [];

    // Create <FileList> list
    for (let i = 0; i < builds.length; i++)
    {
        builds[i].products.forEach(function (product)
        {
            // Also get a version range for all host products targeted by the bundles in the package
            const range = hosts.getVersionRange(product, builds[i].families);

            // Store version range
            if (!hostVersions.hasOwnProperty(product))
            {
                hostVersions[product] = {};
            }

            // If current range values are higher or lower than the stored ones, save them
            if (!hostVersions[product].min || range.min < hostVersions[product].min)
            {
                hostVersions[product].min = range.min;
            }

            if (!hostVersions[product].max || range.max > hostVersions[product].max)
            {
                hostVersions[product].max = range.max;
            }

            FileList.push(`<file products="${hosts.mapToFamilyName(product)}" minVersion="${range.min.toFixed(1)}" maxVersion="${range.max.toFixed(1)}" source="${builds[i].outputFile}" destination="" file-type="CSXS" />`);
        });
    }

    // Create <product> list
    // NOTE: only some products support the "familyname" attribute so we should filter them out
    // (see https://helpx.adobe.com/extension-manager/kb/general-mxi-elements.html#id_64891)
    const familyNameProducts = ['illustrator', 'incopy', 'indesign', 'photoshop'];

    for (let product in hostVersions)
    {
        if (familyNameProducts.indexOf(product) > -1)
        {
            ProductList.push(`<product familyname="${hosts.getProduct(product, 'cc').familyname}" version="${hostVersions[product].min.toFixed(1)}" maxversion="${hostVersions[product].max.toFixed(1)}" primary="true" />`);
        }
        else
        {
            ProductList.push(`<product name="${hosts.getProduct(product, 'cc').familyname}" version="${hostVersions[product].min.toFixed(1)}" maxversion="${hostVersions[product].max.toFixed(1)}" primary="true" />`);
        }
    }

    // Process template
    let templatePath = packaging.mxi;
    if (typeof templatePath !== 'string' || templatePath.length === 0)
    {
        // Fall back to a default template if none is specified in packaging properties
        templatePath = path.resolve(__dirname, '../res/manifest.mxi.xml');
    }

    return fs_readFile(templatePath, 'utf8')
    .then(template =>
    {
        const data = {
            bundle: builds[0].bundle,
            ProductList,
            FileList,
        };

        const mxiManifest = _.template(template, templateOptions)(data);
        return fs_writeFile(path.join(outputPath, mxiFilename), mxiManifest);
    })
    .catch(error => { throw new Error(`Unable to produce MXI manifest: ${error}`); });
};

module.exports = {
    generateDotDebug,
    generateBundleManifest,
    generateMXI,
};
