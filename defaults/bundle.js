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
 * Bundle configuration
 * 
 * Contains information about the extension bundle, that is a container for one
 * or more extensions.
 * See: http://www.adobe.com/devnet/creativesuite/articles/multiple-extensions.html
 */
const bundle = Object.freeze({

    /**
     * Bundle version number (format: "major.minor.patch", for trials add ".trial" at the end).
     * If null or undefined, it will be gathered from the first extension in the bundle.
     * @type {String}
     */
    version: null,

    /**
     * Unique identifier for the bundle (used by Creative Cloud and Extension Manager).
     * Usually provided in a form like "com.developer_name.bundle_name".
     * If null or undefined, it will be gathered from the first extension in the bundle.
     * @type {String}
     */
    id: null,

    /**
     * Bundle name.
     * If null or undefined, it will be gathered from the first extension in the bundle.
     * @type {String}
     */
    name: null,

    /**
     * Author or company name.
     * If null or undefined, it will be gathered from the first extension in the bundle.
     * @type {String}
     */
    author: null,

    /**
     * Path to the template used to compile the bundle manifest.
     * If null or undefined, a default template will be used.
     * @type {String}
     */
    manifest: null,

    /**
     * Debugging
     */
    debug: {

        /**
         * Path to the template used to compile the debug file.
         * If null or undefined, a default template will be used.
         * @type {String}
         */
        template: null,

        /**
         * Host port used for debugging.
         * 
         * In order to support debugging an extension inside multiple products at the
         * same time, each supported product will have an unique debug port assigned:
         * - Photoshop: 8000
         * - Illustrator: 8001
         * - InDesign: 8002
         * - Etc. For a complete list, see ".debug" file.
         * 
         * If bundling multiple extensions, each extension will have its debug
         * port incremented by 100 (i.e. 8000, 8100, 8200, etc.), see ".debug" file.
         * @type {Number}
         */
        port: 8000,

    },

});

module.exports = bundle;
