// const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const OutputHash = require('../../src/OutputHash.js');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    optimization: {
        runtimeChunk: {
            // Add the runtime to a manifest chunk
            name: 'manifest',
        },
        splitChunks: {
            chunks: 'all',
            minChunks: 2,
            minSize: 1,
            cacheGroups: {
                default: {
                    // Add the common chunks into the manifest chunk
                    name: 'manifest',
                },
            },
        },
    },
    entry: {
        entry: rel`./entry.js`,
        vendor: rel`./vendor.js`,
    },
    output: {
        path: rel`../tmp`,
        filename: '[name].[chunkhash].js',
    },
    plugins: [
        new OutputHash({
            manifestFiles: ['manifest'],
        }),
    ],
};

