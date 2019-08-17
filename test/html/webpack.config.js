const OutputHash = require('../../src/OutputHash.js');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    entry: {
        entry: rel`./entry.js`,
        vendor: rel`./vendor.js`,
    },
    plugins: [
        new OutputHash(),
        new HtmlWebpackPlugin({
            cache: false,
            filename: 'index.html',
            chunks: ['vendor', 'entry'],
        }),
    ],
});
