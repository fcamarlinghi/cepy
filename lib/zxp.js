﻿/**
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
      exec = require('child_process').exec,
      chalk = require('chalk'),
      Promise = require('bluebird'),
      log = require('debug')('cepy'),
      rimraf = Promise.promisify(require('rimraf')),
      fs_mkdir = Promise.promisify(require('fs').mkdir),
      zxpBinary = require('zxp-provider')();

/**
 * Generates a self-signed certificate.
 */
const generateCertificate = function (certificate)
{
    return new Promise((resolve, reject) =>
    {
        if (typeof certificate.owner !== 'string' || certificate.owner.length === 0)
        {
            reject('Can not generate a self-signed certificate without specifying a valid "owner"');
        }

        const file = path.resolve(certificate.file);
        const cmd = [
            zxpBinary,
            '-selfSignedCert',
            'US', 'NY',
            `"${certificate.owner}"`,
            `"${certificate.owner}"`,
            `"${certificate.password}"`,
            `"${file}"`
        ];

        // Run ZXP
        log(`Generating certificate at ${chalk.cyan(file)}...`);
        log(cmd.join(' '));

        exec(cmd.join(' '), { cwd: process.cwd() }, (error, stdout, stderr) =>
        {
            if (error === null || error.code === 0)
            {
                resolve();
            }
            else
            {
                reject(`An error occurred when generating the self-signed certificate: ${error}`);
            }
        });
    });
};

/**
 * Packages and signs an HTML5 extension.
 */
const createPackage = function (inputFolder, outputFile, packaging)
{
    return Promise.resolve()

    .then(() =>
    {
        if (typeof inputFolder !== 'string' || inputFolder.length === 0)
        {
            throw new Error(`Invalid input folder: ${inputFolder}`);
        }

        if (typeof outputFile !== 'string' || outputFile.length === 0)
        {
            throw new Error(`Invalid output file: ${outputFile}`);
        }
    })

    // Make sure output path exists and that a file with the same name of the
    // output file doesn't exists (ZXP won't automatically overwrite it)
    .then(() =>
    {
        return fs_mkdir(path.dirname(outputFile), { recursive: true })
        .then(() => { return rimraf(outputFile); });
    })

    .then(() =>
    {
        return new Promise((resolve, reject) =>
        {

            let cmd = [
                zxpBinary,
                '-sign',
                `"${inputFolder}"`,
                `"${outputFile}"`,
                `"${packaging.certificate.file}"`,
                `"${packaging.certificate.password}"`,
            ];

            if (typeof packaging.timestampURL === 'string' && packaging.timestampURL.length > 0)
            {
                cmd.push('-tsa', `"${packaging.timestampURL}"`);
            }

            log(`Creating ZXP package at ${chalk.cyan(outputFile)}...`);
            log(cmd.join(' '));

            // Run ZXP
            exec(cmd.join(' '), { cwd: process.cwd() }, (error, stdout, stderr) =>
            {
                if (error === null || error.code === 0)
                {
                    resolve();
                }
                else
                {
                    reject(`Unable to create ZXP package: ${error}`);
                }
            });
        });
    })
};

module.exports = {
    generateCertificate,
    createPackage,
};
