var yr = require('yate/lib/runtime.js');

yr.externals.attrs = function() {
    return {
        'class': new yr.scalarAttr('b-hello'),
        'id': new yr.scalarAttr('hello')
    };
};

