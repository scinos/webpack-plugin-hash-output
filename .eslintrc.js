module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2016,
    },
    env: {
        es6: true,
        node: true,
    },
    extends: ['plugin:prettier/recommended'],

    rules: {
        // http://eslint.org/docs/rules/no-param-reassign
        // Allow param reassign. We need to do this a lot in the plugin
        'no-param-reassign': ['off'],

        // http://eslint.org/docs/rules/no-underscore-dangle
        // Allow references starting with underscore. Webpack has those.
        'no-underscore-dangle': ['off'],
    },
};
