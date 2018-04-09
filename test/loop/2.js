require.ensure([], (require) => {
    require('./1');
    console.log('I am 2');
});
