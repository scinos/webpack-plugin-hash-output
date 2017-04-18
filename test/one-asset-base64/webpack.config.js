const OutputHash = require('../../src/OutputHash.js');
const path = require('path');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    entry: rel`./entry.js`,
    output: {
        path: rel`../tmp`,
        filename: '[name].[chunkhash].js',
        hashDigest: 'base64',
    },
    plugins: [
        new OutputHash(),
    ],
};

