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

/** 
 * Extension configuration
 * 
 * An extension that will be added to the bundle.
 */
const extension = Object.freeze({

    // Extension version number (format: "major.minor.patch")
    version: '0.1.0',

    // Unique identifier for the extension (used by Creative Cloud and Adobe Exchange)
    // Usually provided in a form like "com.developer_name.bundle_name.extension_name"
    id: '',

    // Extension name
    name: '',

    // Extension root file
    mainPath: '',

    // Extension ExtendScript root file
    scriptPath: '',

    // CEF command line parameters
    cefParameters: [],

    // Extension type (i.e. "Panel", "ModalDialog", etc.)
    type: 'Panel',

    // Extension lifecycle
    lifecycle: {

        // True to make the extension's UI automatically visible
        autoVisible: true,

        // A set of events that can start this extension
        events: [],

    },

    // Extension icons. Each icon should be a 23x23px PNG
    // Paths are relative to the extension folder
    icons: {
        light: {
            normal: '',
            hover: '',
            disabled: '',
        },
        dark: {
            normal: '',
            hover: '',
            disabled: '',
        },
    },

    // Panel/window dimensions (in pixels)
    size: {
        base: { width: 320, height: 400 },
        min: { width: 320, height: 300 },
        max: { width: 800, height: 2400 },
    },

    // Extension manifest template
    // If null or undefined, a default template will be used
    manifest: null,

});

module.exports = extension;
