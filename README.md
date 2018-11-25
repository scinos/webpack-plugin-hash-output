# webpack-plugin-hash-output

[![Build Status](https://travis-ci.org/scinos/webpack-plugin-hash-output.svg?branch=master)](https://travis-ci.org/scinos/webpack-plugin-hash-output)

Plugin to replace webpack chunkhash with an md5 hash of the final file conent.

## Installation

With npm
```
npm install webpack-plugin-hash-output --save-dev
```

With yarn
```
yarn add webpack-plugin-hash-output --dev
```

## Why?

There are other webpack plugins for hashing out there. But when they run, they don't "see" the final form of the code, because they run
*before* plugins like `webpack.optimize.UglifyJsPlugin`. In other words, if you change `webpack.optimize.UglifyJsPlugin` config, your
hashes won't change, creating potential conflicts with cached resources.

The main difference is that `webpack-plugin-hash-output` runs in the last compilation step. So any change in webpack or any other plugin
that actually changes the output, will be "seen" by this plugin, and therefore that change will be reflected in the hash.

It will generate files like `entry.<hash>.js`, where `<hash>` is always a hash of the content (well, a subset of). Example:

```
$ md5 entry.32f1718dd08eccda2791.js

MD5 (entry.32f1718dd08eccda2791.js) = 32f1718dd08eccda2791ff7ed466bd98
```

All other assets (common files, manifest files, HTML output...) will use the new md5 hash to reference the asset.

## Compatibility

Requires webpack >=4

## Usage

Just add this plugin as usual.

```javascript
// webpack.config.js
const HashOutput = require('webpack-plugin-hash-output');

module.exports = {
    // ...
    output: {
        //...
        filename: '[name].[chunkhash].js',
    },
    plugins: [
        new HashOutput(options)
    ]
};
```

## Sourcemap support

This plugin partially supports sourcemaps. When a chunk hash is recomputed, it will update the name
of the chunk in the chunks's sourcemap, but it won't recompute the name of the hash file. This has
the side effect that the name of the sourcemap will differ from the name of the chunk. Example:

Before:
```javascript
// app.<oldhash>.js

// ...code...
//# sourceMappingURL=entry.<oldhash>.js.map
```

```javascript
// app.<oldhash>.js.map

// ...
"file":"app.<oldhash>.js"
// ...
```

After:
```javascript
// app.<newhash>.js

// ...code...
//# sourceMappingURL=entry.<oldhash>.js.map
```

```javascript
// app.<oldhash>.js.map

// ...
"file":"app.<newhash>.js"
// ...
```

We can't fully support sourcemaps (i.e. recomute sourcemap hash) because the circular reference: we
can't compute sourcemap hash without computing the file hash first, and we can't compute the file
hash without the sourcemap hash.

## Interaction with other plugins

Because this plugin modifies the name of the assets, it break other plugins that also operate on the name of the assets
if the order of the plugins is not correct. For `plugin-webpack-hash-output` to work, it has to be the first plugin to
run in the `emit` phase. Inside the same phase, the order of the plugins is determined by the order in which they appear
in webpack's config option `plugins`.

A specific example of this is [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin): `plugin-webpack-hash-output`
must be listed _before_ `html-webpack-plugin`. Example:

```javascript
plugins: [
    new HashOutput(...),
    new HtmlWebpackPlugin(...),
]
```

When the webpack compilation starts, this plugin will check if there are other plugins that might conflict with the output and
display a warning. It is recommended you fix the order of the plugins unless you really know what you are doing:

```
[WARNING] There are other plugins configured that might interfere with webpack-plugin-hash-output.
For this plugin to work correctly, it should be the first plugin in the "emit" phase. Please
be sure that the rest of the plugins run after webpack-plugin-hash-output (ensure they are listed
after webpack-plugin-hash-output in the 'plugins' option in your webpack config).

Plugins that could interfere with webpack-plugin-hash-output:
 * HtmlWebpackPlugin
```


## Options

> Note: Use Webpack's own [hash output options](https://webpack.js.org/configuration/output/#output-hashfunction) to
  configure hash function and length.

### `options.validateOutput`

`boolean`, defaults to `false`.

After webpack has compiled and generated all the assets, checks that the hash of the content is included in the file. If it is not, it will throw an error
and the webpack process will fail.


### `options.validateOutputRegex`
`regex`, defaults to `/^.*$/`

When validating the output (see `options.validateOutput`), only evaluate hashes for files matching this regexp.
Useful for skipping source maps or other output. Example:

```javascript
module.exports = {
    entry: {
        main: './src/app.js',
    },
    output: {
        filename: 'assets/[name].[chunkhash].js',
    },
    plugins: [
        new HashOutput({
            validateOutput: true,
            // Check that md5(assets/main.<hash>.js) === <hash>, but doesn't check fragments/app.html
            validateOutputRegex: /^assets\/.*\.js$/,
        }),
        new HtmlWebpackPlugin({
            filename: 'fragments/app.html',
            chunks: ['main'],
        }),
    ]
};
```


## Contributions

### Running tests

Tests can be run by:

```
yarn test
```

After running the tests, you might want to run `yarn run clean` to clean up temp files generated by the tests.
