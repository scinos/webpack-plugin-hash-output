// const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const OutputHash = require('../../src/OutputHash.js');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    devtool: 'sourcemap',
    optimization: Object.assign({}, baseConfig.optimization, {
        runtimeChunk: {
            name: 'manifest',
        },
        splitChunks: {
            chunks: 'all',
            minChunks: 2,
            minSize: 1,
            cacheGroups: {
                default: {
                    name: 'manifest',
                },
            },
        },
    }),
    entry: {
        entry: rel`./entry.js`,
        vendor: rel`./vendor.js`,
    },
    plugins: [new OutputHash()],
});
