const OutputHash = require('../../src/OutputHash.js');
const path = require('path');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    entry: {
        entry1: rel`./entry-1.js`,
        entry2: rel`./entry-2.js`,
    },
    output: {
        path: rel`../tmp`,
        filename: '[name].[chunkhash].js',
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            minChunks: 1,
            minSize: 1,
        },
    },
    plugins: [
        new OutputHash(),
    ],
};
