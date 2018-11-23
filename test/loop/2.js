/* global document */
require.ensure([], require => {
    require('./1');
    document.write('I am 2');
});
