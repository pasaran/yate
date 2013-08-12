var fs_ = require('fs');

require('no.colors');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate
//  ---------------------------------------------------------------------------------------------------------------  //

var yate = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.version = require('../package.json').version;

yate.cliOptions = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.inherit = function(ctor, base, mixin) {
    var F = function() {};
    F.prototype = base.prototype;
    var proto = ctor.prototype = new F();

    if (mixin) {
        if (mixin instanceof Array) {
            for (var i = 0, l = mixin.length; i < l; i++) {
                yate.extend( proto, mixin[i] );
            }
        } else {
            yate.extend(proto, mixin);
        }
    }

    proto.super_ = base.prototype;
    proto.constructor = ctor;

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.extend = function(dest) {
    for (var i = 1, l = arguments.length; i < l; i++) {
        var src = arguments[i];
        for (var key in src) {
            dest[key] = src[key];
        }
    }

    return dest;
};
//  ---------------------------------------------------------------------------------------------------------------  //

yate.nop = function() {};

yate.true = function() { return true; };
yate.false = function() { return false; };

//  ---------------------------------------------------------------------------------------------------------------  //

yate.value = function(value) {
    return function() {
        return value;
    };
};
//  ---------------------------------------------------------------------------------------------------------------  //

yate.error = function(msg, pos) {
    var filename = pos.filename;

    var content = fs_.readFileSync(filename, 'utf-8');
    var lines = content.split('\n');

    var x = pos.x;
    var y = pos.y;
    var line = lines[y] || '';

    var error = '';
    error += msg.red.bold + '\n\n';
    error += '    at ' + filename.lime + ' (line: ' + (y + 1).toString().lime + ' col: ' + (x + 1).toString().lime + ')\n\n';
    error += '    ' + line.blue + '\n    ' + Array(x + 1).join(' ') + '^'.red + '\n';

    throw new Error(error);
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = yate;

//  ---------------------------------------------------------------------------------------------------------------  //

