const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const webpack = require('webpack');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
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

        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor', 'manifest'],
            filename: '[name].[chunkhash].js',
        }),
    ],
};

