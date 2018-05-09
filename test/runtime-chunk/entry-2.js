/* global document */
document.write('This is a test 2');
require.ensure([], (require) => {
    require('./on-demand');
});
