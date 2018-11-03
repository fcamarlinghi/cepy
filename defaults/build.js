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
 * Build configuration
 *
 * Refer to config.js for more informations about builds.
 */
const build = Object.freeze({

    /**
     * Build source folder.
     * @type {String}
     */
    source: '',

    /**
     * Bundle configuration, see bundle.js.
     * @type {Object}
     */
    bundle: {},

    /**
     * Extensions array, see extension.js.
     * @type {Object[]}
     */
    extensions: [],

    /**
     * Products targeted by this build.
     * @type {(String|String[])}
     */
    products: [],

    /**
     * Families targeted by this build, specified as either a range of supported families,
     * or as the minimum supported family.
     * @type {(String|String[])}
     * 
     * @example
     * Arrays will always be treated as a range of supported versions, whereas a string
     * will be treated as the minimum requirement for the bundle. Examples:
     * 
     * ['CC2014', 'CC2017']: support families ranging from CC 2014 to CC 2017 (including families in-between)
     * ['CC2014']: only support CC 2014
     * 'CC2014': support CC 2014 and all future versions (CC2015, CC2015.5, CC2017 and so on)
     */
    families: [],

});

module.exports = build;
