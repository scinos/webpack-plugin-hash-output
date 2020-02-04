const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    entry: {
        entry1: rel`./entry-1.js`,
    },
    optimization: Object.assign({}, baseConfig.optimization, {
        runtimeChunk: { name: 'manifest' },
        splitChunks: {
            chunks: 'all',
            minChunks: 1,
            minSize: 1,
        },
    }),
    plugins: [
        new OutputHash({
            replacementFilterRegex: /bad-filter\..*\.js$/,
        }),
    ],
});
