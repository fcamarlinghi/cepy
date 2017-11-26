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

    // Build source folder
    source: '',

    // Bundle configuration, see bundle.js
    bundle: {},

    // Extensions array, see extension.js
    extensions: [],

    // Products targeted by this build
    products: [],

    // Families targeted by this build
    families: [],

});

module.exports = build;
