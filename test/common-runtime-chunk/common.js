/* global document */
document.write('common');
require.ensure([], require => {
    require('./on-demand');
});
