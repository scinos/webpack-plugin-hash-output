const OutputHash = require('../../src/OutputHash.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const baseConfig = require('../base.webpack.config');

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
    entry: rel`./entry.js`,
    devtool: 'sourcemap',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            modules: true,
                        },
                    },
                ],
            },
        ],
    },
    optimization: Object.assign({}, baseConfig.optimization, {
        runtimeChunk: true,
    }),
    plugins: [
        new OutputHash(),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
        }),
    ],
});
