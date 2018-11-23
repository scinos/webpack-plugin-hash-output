const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    entry: {
        entry: rel`./entry.js`,
    },
    devtool: 'sourcemap',
    output: Object.assign({}, baseConfig.output, {
        sourceMapFilename: '[name].[chunkhash].js.map',
    }),
    plugins: [new OutputHash()],
});
