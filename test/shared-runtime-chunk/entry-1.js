/* global document, System */
const module1 = require('./shared-1');

System.import(/* webpackChunkName: 'async' */ './async').then((async) => {
    document.write(`entry-1: ${module1} ${async}`);
});
