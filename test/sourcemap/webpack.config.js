const OutputHash = require('../../src/OutputHash.js');
const path = require('path');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    entry: {
        entry: rel`./entry.js`,
    },
    devtool: 'sourcemap',
    output: {
        path: rel`../tmp`,
        filename: '[name].[chunkhash].js',
        sourceMapFilename: '[name].[chunkhash].js.map',
    },
    plugins: [
        new OutputHash(),
    ],
};
