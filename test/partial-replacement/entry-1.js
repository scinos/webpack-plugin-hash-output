/* global document */
document.write('This is a test');
require.ensure([], require => {
    require('./async-1');
});
