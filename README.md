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


## Usage

Just add this plugin as usual.

```javascript
// webpack.config.js
var HashOutput = require('webpack-plugin-hash-output');

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

## Options

> Note: Use Webpack's own [hash output options](https://webpack.js.org/configuration/output/#output-hashfunction) to
  configure hash function and length.

### `options.manifestFiles`

`(string|regexp)[]`, defaults to `[]`.

Array of files that act like a manifest: files that has references to other files. You need to use this option if, for example, you are generating a common chunk or an external webpack manifest. In general, if a file references other files, it needs to be here.

Note: If you are using `html-webpack-plugin`, you don't need to include the html files here, they will be handled automatically.

Examples

```javascript
module.exports = {
    entry: {
        entry1: './entry1.js',
        entry2: './entry2.js',
        vendor: './vendor.js',
    },
    devtool: 'sourcemap'
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
        }),
        new OutputHash({
            manifestFiles: [
                // Because 'vendor' will contain the webpack manifest that references
                // other entry points
                'vendor'
            ]
        }),
    ]
};
```

### `options.recalculateManifestFilesHash`

`boolean`, defaults to `false`.

In order to integrate this plugin with [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) plugin (or with any other plugin that might change manifest file output and must run in the last compilation step) without breaking **Long Term Caching** set this `true`.

The problem is that [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) must be the last to run because it has to know the final hashes of the files.
Then, it injects the calculated values into the manifest files.
As a result, the filename which is an hash of the content isn't valid anymore.  
Setting this option to true, makes the plugin recalculate the hashes of the manifest files at the emit phase which makes them valid again.

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
        new HtmlWebpackPlugin({
            filename: 'fragments/app.html',
            chunks: ['main'],
        }),
        new OutputHash({
            validateOutput: true,
            // Check that md5(assets/main.<hash>.js) === <hash>, but doesn't check fragments/app.html
            validateOutputRegex: /^assets\/.*\.js$/,
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
