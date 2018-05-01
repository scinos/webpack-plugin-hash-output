const OutputHash = require('../../src/OutputHash.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const rel = (paths => path.resolve(__dirname, ...paths));

module.exports = {
    entry: rel`./entry.js`,
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
    optimization: {
        runtimeChunk: true,
    },
    output: {
        path: rel`../tmp`,
        filename: '[name].[chunkhash].js',
    },
    plugins: [
        new OutputHash(),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
        }),
    ],
};
