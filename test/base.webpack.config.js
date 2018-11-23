const path = require('path');
const rel = paths => path.resolve(__dirname, ...paths);

module.exports = {
    output: {
        path: rel`./tmp`,
        filename: '[name].[chunkhash].js',
    },

    // This is not required for the plugin to work, but it makes the tests easier because we can use
    // names instead of ids to address the chunks.
    optimization: {
        namedModules: true,
        namedChunks: true,
    },
};
