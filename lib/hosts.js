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

/**
 * Supported host products by family.
 */
const HOSTS = Object.freeze({

    'cc2015.5': {
        photoshop: {
            familyname: 'Photoshop',
            name: 'Photoshop',
            ids: ['PHXS', 'PHSP'],
            version: { min: 17.0, max: 17.9 },
            bin: { win: 'Photoshop.exe', mac: 'Adobe Photoshop CC 2015.5.app' },
            x64: true
        },
        illustrator: {
            familyname: 'Illustrator',
            name: 'Illustrator',
            ids: ['ILST'],
            version: { min: 20.0, max: 20.9 },
            bin: { win: 'Support Files/Contents/Windows/Illustrator.exe', mac: 'Adobe Illustrator CC 2015.3.app' },
            folder: 'Adobe Illustrator CC 2015.3',
            x64: true
        },
        indesign: {
            familyname: 'InDesign',
            name: 'InDesign',
            ids: ['IDSN'],
            version: { min: 11.0, max: 11.9 },
            bin: { win: 'InDesign.exe', mac: 'Adobe InDesign CC 2015.app' },
            x64: true
        },
        flash: {
            familyname: 'Flash',
            name: 'Flash',
            ids: ['FLPR'],
            version: { min: 15.0, max: 15.9 },
            bin: { win: 'Flash.exe', mac: 'Adobe Flash CC 2015.app' },
            folder: 'Adobe Flash CC 2015.2',
            x64: true
        },
        aftereffects: {
            familyname: 'AfterEffects',
            name: 'After Effects',
            ids: ['AEFT'],
            version: { min: 13.5, max: 13.9 },
            bin: { win: 'Support Files/AfterFX.exe', mac: 'Adobe After Effects CC 2015.3.app' },
            folder: 'Adobe After Effects CC 2015.3',
            x64: true
        },
        premiere: {
            familyname: 'Premiere',
            name: 'Premiere Pro',
            ids: ['PPRO'],
            version: { min: 10.0, max: 10.9 },
            bin: { win: 'Adobe Premiere Pro.exe', mac: 'Adobe Premiere Pro CC 2015.app' },
            folder: 'Adobe Premiere Pro CC 2015.3',
            x64: true
        },
        prelude: {
            familyname: 'Prelude',
            name: 'Prelude',
            ids: ['PRLD'],
            version: { min: 5.0, max: 5.9 },
            bin: { win: 'Prelude.exe', mac: 'Adobe Prelude CC 2015.app' },
            folder: 'Adobe Prelude CC 2015.4',
            x64: false
        },
        dreamweaver: {
            familyname: 'Dreamweaver',
            name: 'Dreamweaver',
            ids: ['DRWV'],
            version: { min: 15.0, max: 15.9 },
            bin: { win: 'Dreamweaver.exe', mac: 'Adobe Dreamweaver CC 2015.app' },
            x64: false
        },
        incopy: {
            familyname: 'InCopy',
            name: 'InCopy',
            ids: ['AICY'],
            version: { min: 11.0, max: 11.9 },
            bin: { win: 'InCopy.exe', mac: 'Adobe InCopy CC 2015.app' },
            x64: true
        }
    },

    'cc2015': {
        photoshop: {
            familyname: 'Photoshop',
            name: 'Photoshop',
            ids: ['PHXS', 'PHSP'],
            version: { min: 16.0, max: 16.9 },
            bin: { win: 'Photoshop.exe', mac: 'Adobe Photoshop CC 2015.app' },
            x64: true
        },
        illustrator: {
            familyname: 'Illustrator',
            name: 'Illustrator',
            ids: ['ILST'],
            version: { min: 19.0, max: 19.9 },
            bin: { win: 'Support Files/Contents/Windows/Illustrator.exe', mac: 'Adobe Illustrator CC 2015.app' },
            x64: true
        },
        indesign: {
            familyname: 'InDesign',
            name: 'InDesign',
            ids: ['IDSN'],
            version: { min: 11.0, max: 11.9 },
            bin: { win: 'InDesign.exe', mac: 'Adobe InDesign CC 2015.app' },
            x64: true
        },
        flash: {
            familyname: 'Flash',
            name: 'Flash',
            ids: ['FLPR'],
            version: { min: 15.0, max: 15.9 },
            bin: { win: 'Flash.exe', mac: 'Adobe Flash CC 2015.app' },
            x64: true
        },
        aftereffects: {
            familyname: 'AfterEffects',
            name: 'After Effects',
            ids: ['AEFT'],
            version: { min: 13.5, max: 13.9 },
            bin: { win: 'Support Files/AfterFX.exe', mac: 'Adobe After Effects CC 2015.app' },
            x64: true
        },
        premiere: {
            familyname: 'Premiere',
            name: 'Premiere Pro',
            ids: ['PPRO'],
            version: { min: 9.0, max: 9.9 },
            bin: { win: 'Adobe Premiere Pro.exe', mac: 'Adobe Premiere Pro CC 2015.app' },
            x64: true
        },
        prelude: {
            familyname: 'Prelude',
            name: 'Prelude',
            ids: ['PRLD'],
            version: { min: 4.0, max: 4.9 },
            bin: { win: 'Prelude.exe', mac: 'Adobe Prelude CC 2015.app' },
            x64: false
        },
        dreamweaver: {
            familyname: 'Dreamweaver',
            name: 'Dreamweaver',
            ids: ['DRWV'],
            version: { min: 15.0, max: 15.9 },
            bin: { win: 'Dreamweaver.exe', mac: 'Adobe Dreamweaver CC 2015.app' },
            x64: false
        },
        incopy: {
            familyname: 'InCopy',
            name: 'InCopy',
            ids: ['AICY'],
            version: { min: 11.0, max: 11.9 },
            bin: { win: 'InCopy.exe', mac: 'Adobe InCopy CC 2015.app' },
            x64: true
        }
    },

    'cc2014': {
        photoshop: {
            familyname: 'Photoshop',
            name: 'Photoshop',
            ids: ['PHXS', 'PHSP'],
            version: { min: 15.0, max: 15.9 },
            bin: { win: 'Photoshop.exe', mac: 'Adobe Photoshop CC 2014.app' },
            x64: true
        },
        illustrator: {
            familyname: 'Illustrator',
            name: 'Illustrator',
            ids: ['ILST'],
            version: { min: 18.0, max: 18.9 },
            bin: { win: 'Support Files/Contents/Windows/Illustrator.exe', mac: 'Adobe Illustrator CC 2014.app' },
            x64: true
        },
        indesign: {
            familyname: 'InDesign',
            name: 'InDesign',
            ids: ['IDSN'],
            version: { min: 10.0, max: 10.9 },
            bin: { win: 'InDesign.exe', mac: 'Adobe InDesign CC 2014.app' },
            x64: true
        },
        flash: {
            familyname: 'Flash',
            name: 'Flash',
            ids: ['FLPR'],
            version: { min: 14.0, max: 14.9 },
            bin: { win: 'Flash.exe', mac: 'Adobe Flash CC 2014.app' },
            x64: true
        },
        aftereffects: {
            familyname: 'AfterEffects',
            name: 'After Effects',
            ids: ['AEFT'],
            version: { min: 13.0, max: 13.4 },
            bin: { win: 'Support Files/AfterFX.exe', mac: 'Adobe After Effects CC 2014.app' },
            x64: true
        },
        premiere: {
            familyname: 'Premiere',
            name: 'Premiere Pro',
            ids: ['PPRO'],
            version: { min: 8.0, max: 8.9 },
            bin: { win: 'Adobe Premiere Pro.exe', mac: 'Adobe Premiere Pro CC 2014.app' },
            x64: true
        },
        prelude: {
            familyname: 'Prelude',
            name: 'Prelude',
            ids: ['PRLD'],
            version: { min: 3.0, max: 3.9 },
            bin: { win: 'Prelude.exe', mac: 'Adobe Prelude CC 2014.app' },
            x64: false
        },
        dreamweaver: {
            familyname: 'Dreamweaver',
            name: 'Dreamweaver',
            ids: ['DRWV'],
            version: { min: 14.0, max: 14.9 },
            bin: { win: 'Dreamweaver.exe', mac: 'Adobe Dreamweaver CC 2014.app' },
            x64: false
        },
        incopy: {
            familyname: 'InCopy',
            name: 'InCopy',
            ids: ['AICY'],
            version: { min: 10.0, max: 10.9 },
            bin: { win: 'InCopy.exe', mac: 'Adobe InCopy CC 2014.app' },
            x64: true
        }
    },

    'cc': {
        photoshop: {
            familyname: 'Photoshop',
            name: 'Photoshop',
            ids: ['PHXS', 'PHSP'],
            version: { min: 14.0, max: 14.9 },
            bin: { win: 'Photoshop.exe', mac: 'Adobe Photoshop CC.app' },
            x64: true
        },
        illustrator: {
            familyname: 'Illustrator',
            name: 'Illustrator',
            ids: ['ILST'],
            version: { min: 17.0, max: 17.9 },
            bin: { win: 'Support Files/Contents/Windows/Illustrator.exe', mac: 'Adobe Illustrator CC.app' },
            x64: true
        },
        indesign: {
            familyname: 'InDesign',
            name: 'InDesign',
            ids: ['IDSN'],
            version: { min: 9.0, max: 9.9 },
            bin: { win: 'InDesign.exe', mac: 'Adobe InDesign CC.app' },
            x64: true
        },
        flash: {
            familyname: 'Flash',
            name: 'Flash',
            ids: ['FLPR'],
            version: { min: 13.0, max: 13.9 },
            bin: { win: 'Flash.exe', mac: 'Adobe Flash CC.app' },
            x64: true
        },
        aftereffects: {
            familyname: 'AfterEffects',
            name: 'After Effects',
            ids: ['AEFT'],
            version: { min: 12.0, max: 12.9 },
            bin: { win: 'Support Files/AfterFX.exe', mac: 'Adobe After Effects CC.app' },
            x64: true
        },
        premiere: {
            familyname: 'Premiere',
            name: 'Premiere Pro',
            ids: ['PPRO'],
            version: { min: 7.0, max: 7.9 },
            bin: { win: 'Adobe Premiere Pro.exe', mac: 'Adobe Premiere Pro CC.app' },
            x64: true
        },
        prelude: {
            familyname: 'Prelude',
            name: 'Prelude',
            ids: ['PRLD'],
            version: { min: 2.0, max: 2.9 },
            bin: { win: 'Prelude.exe', mac: 'Adobe Prelude CC.app' },
            x64: false
        },
        dreamweaver: {
            familyname: 'Dreamweaver',
            name: 'Dreamweaver',
            ids: ['DRWV'],
            version: { min: 13.0, max: 13.9 },
            bin: { win: 'Dreamweaver.exe', mac: 'Adobe Dreamweaver CC.app' },
            x64: false
        },
        incopy: {
            familyname: 'InCopy',
            name: 'InCopy',
            ids: ['AICY'],
            version: { min: 9.0, max: 9.9 },
            bin: { win: 'InCopy.exe', mac: 'Adobe InCopy CC.app' },
            x64: true
        }
    }
});

/**
 * Gets information about a single product.
 * @param {String} product
 * @param {String} family
 * @returns {Object}
 */
const getProduct = function (product, family)
{
    if (!HOSTS.hasOwnProperty(family))
    {
        throw new Error(`Unknown product family "${family}".`);
    }

    if (!HOSTS[family].hasOwnProperty(product))
    {
        throw new Error(`Unknown product "${product} (${family})`);
    }

    return HOSTS[family][product];
};

/**
 * Returns the individual product version range for the given product families.
 * @param {String} product
 * @param {Array} families
 * @returns {Object}
 */
const getVersionRange = function (product, families)
{
    let min, max, host;

    for (let i = 0; i < families.length; i++)
    {
        host = getProduct(product, families[i]);

        if (!min || host.version.min < min)
        {
            min = host.version.min;
        }

        if (!max || host.version.max > max)
        {
            max = host.version.max;
        }
    }

    return { min: min, max: max };
};

/**
 * Maps the passed product to its family name equivalent (needed in MXI files).
 * @returns {string}
 */
const mapToFamilyName = function (product)
{
    // CC products need to be specified using the following mapping
    // http://helpx.adobe.com/extension-manager/kb/general-mxi-elements.html#id_64891
    const map = {
        'Illustrator': 'Illustrator,Illustrator32,Illustrator64',
        'InCopy': 'InCopy,InCopy32,InCopy64',
        'InDesign': 'InDesign,InDesign32,InDesign64',
        'Photoshop': 'Photoshop,Photoshop32,Photoshop64'
    };

    const productFamilyName = getProduct(product, 'cc').familyname;
    return map[productFamilyName] || productFamilyName;
};

module.exports = {
    getProduct,
    getVersionRange,
    mapToFamilyName,
};
