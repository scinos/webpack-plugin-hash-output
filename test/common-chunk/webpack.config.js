const OutputHash = require('../../src/OutputHash.js');
const path = require('path');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    devtool: 'sourcemap',
    optimization: {
        splitChunks: {
            chunks: 'all',
            minChunks: 2,
            minSize: 1,
            cacheGroups: {
                default: {
                    name: 'common',
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
        new OutputHash(),
    ],
};

