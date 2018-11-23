const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    devtool: 'sourcemap',
    entry: {
        entry1: rel`./entry-1.js`,
        entry2: rel`./entry-2.js`,
    },
    plugins: [new OutputHash()],
    optimization: Object.assign({}, baseConfig.optimization, {
        runtimeChunk: true,
    }),
});
