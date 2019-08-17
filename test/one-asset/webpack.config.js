const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    entry: rel`./entry.js`,
    plugins: [new OutputHash({ validateOutput: true })],
});
