require.ensure([], (require) => {
    require('./2');
    console.log('I am 1');
});
