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
 * Main configuration
 * 
 * Contains information about builds and packaging
 */
const config = Object.freeze({

    /**
     * Builds configuration
     * 
     * A dictionary ('name': {config}) of individual builds that should be executed. Each one
     * represents a CEP extension that will be packaged and bundled in the final ZXP installer.
     *
     * This is useful to have multiple build profiles for the same extension(s) when custom
     * configuration by product/family is needed: i.e. to target different versions of Photoshop
     * (CC, CC2014 and so on) using the same package.
     */
    builds: {},

    /**
     * Packaging configuration
     * 
     * Contains information about the final ZXP package.
     */
    packaging: {

        /**
         * Output ZXP package file path.
         * @type {String}
         */
        output: 'output.zxp',

        /**
         * Timestamp server URL.
         * @type {String}
         */
        timestampURL: '',

        /**
         * Certificate used to sign the package.
         */
        certificate: {

            /**
             * Certificate owner.
             * @type {String}
             */
            owner: '',

            /**
             * Path to the certificate file.
             * @type {String}
             */
            file: null,

            /**
             * Certificate password.
             * @type {String}
             */
            password: '',

        },

        /**
         * Description of the package (supports HTML markup).
         * @type {String}
         */
        description: '',

        /**
         * License agreement shown when installing the package (supports HTML markup).
         * See https://www.adobeexchange.com/resources/7#eula for an example.
         * @type {String}
         */
        license: '',

        /**
         * MXI file template. If null or undefined, a default template will be used.
         * @type {String}
         */
        mxi: null,

        /**
         * Temporary staging folder used while packaging multiple builds.
         * @type {String}
         */
        staging: '.staging',
    },

});

module.exports = config;
