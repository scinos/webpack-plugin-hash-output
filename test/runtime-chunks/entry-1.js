/* global document */
document.write('This is a test 1');
require.ensure([], (require) => {
    require('./on-demand');
});
