/* global document */
require.ensure([], (require) => {
    require('./2');
    document.write('I am 1');
});
