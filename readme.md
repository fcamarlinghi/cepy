
#cepy
> A command line utility that helps debugging and packaging HTML5-based extensions for Adobe Creative Cloud applications.

This is an attempt to build a tool with all the capabilities of [grunt-cep](https://github.com/fcamarlinghi/grunt-cep/) (and more!), but completely decoupled from Grunt and its conventions/ecosystem.

The project is currently used by the [*Expresso!*](https://github.com/fcamarlinghi/expresso/) extension for Photoshop. Please refer to the [Usage Example](#usage-example) section below for a quick overview of the tool.

## Goals:
* Decouple *grunt-cep* from Grunt, so that the tool can be used with vanilla NodeJS, NPM scripts and command line.
* Make less assumptions about user needs so that the tool is more generic and flexible.
* Simpler configuration, customization and usage.
* Use modern code standards to achieve better performance and maintainability.
* Add more built-in functionality alongside what *grunt-cep* already offers, i.e.:
 * Simple project scaffolding. Just as [grunt-init-cep](https://github.com/fcamarlinghi/grunt-init-cep/), but built-in.
 * Generate manifest/debug files in a folder of choice. Useful to integrate the tool in a build process (i.e. webpack, browserify, etc.).
* More flexibility when it comes to hybrid extensions.
* Easy migration path from *grunt-cep*. Provide a *grunt-cepy* plugin to be able to continue to use the utility from Grunt.

## Status
The project is in its early days. Most of the features of *grunt-cep* are already ported over, but might still be unstable/not completely working.

Next steps:
* Continue to experiment with the concept of "build" as the backbone of the tool.
* Consider which config settings might be moved out of the config file to provide more flexibility from command line and code.
* Improve command line/NodeJS APIs.
* Add more commands (such as *create* for project scaffolding).
* Add support for using minimum product versions in manifest/mxi files (see [this post](http://www.davidebarranca.com/2016/06/html-panel-tips-21-photoshop-cc2015-5-2016-survival-guide/)).
* Better console output and error reporting (especially when using the tool programmatically).
* Rework hybrid extensions support.

## Usage Example
Config file:
```js
// cepy.js

module.exports = {
	builds: {
		'example-build': {
			source: 'example-src',
			products: ['photoshop'],
			families: ['cc2015.5'],
			bundle: {
				id: 'com.acme.awesomebundle',
			}
			extensions: [{
				id: 'com.acme.awesomebundle.extension1',
				name 'Example Extension 1',
				mainPath: 'extension-1/index.html',
			},
			{
				id: 'com.acme.awesomebundle.extension2',
				name 'Example Extension 2',
				mainPath: 'extension-2/index.html',
			}]
		}
	},
	packaging: {
		output: 'release/my-awesome-bundle.zxp',
		certificate: {
			owner: 'acme',
			password: 'some password',
			file: 'distrib/acme-certificate.p12',
		}
	}
};
```
From the command line:
```shell
# cepy.js will be automatically loaded when running the tool
# use the --config <path> switch to select a custom config file path

# generate manifest/debug files for the 'example-build' build
cepy compile --output ./build --debug example-build

# or
# launch the 'example-build' build in debug mode
cepy launch --debug example-build

# or
# run all the builds in release mode (won't generate .debug file) and package them in an output .ZXP file
cepy release
```
From code:
```js
const cepy = require('cepy'),
      config = require('./cepy.js');

// generate manifest/debug files for the 'example-build' build
cepy(config).compile('example-build', 'output-folder', true);

// or
// launch the 'example-build' build in debug mode
cepy(config).launch('example-build', true);

// or
// run all the builds in release mode (won't generate .debug file) and package them in an output .ZXP file
cepy(config).release(false);
```

## Contributing

Feedback and pull requests are extremely welcome!

## License
Copyright &copy; 2016 Francesco Camarlinghi

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

