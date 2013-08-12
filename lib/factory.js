var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //

require('./ast.js');

var asts = require('./asts.js');

//  ---------------------------------------------------------------------------------------------------------------  //

function Factory(asts) {
    this.asts = asts;
    this.ctors = {
        '': yate.AST
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

Factory.prototype.make = function(id, pos, params) {
    var ctor = this.get(id);
    var ast = new ctor();

    //  Точка во входном потоке, соответствующая этому AST.
    ast.pos = pos;

    //  Вызываем "конструктор", если он есть.
    //  Настоящий конструктор пустой для упрощения наследования.
    if (ast._init) {
        ast._init();
    }

    //  Если переданы params, то вызываем "конструктор копии".
    if (params && ast.copy) {
        ast.copy(params);
    }

    return ast;
};

Factory.prototype.get = function(id) {
    var ctor = this.ctors[id];

    if (!ctor) {
        ctor = function() {};

        var proto = this.asts[id] || {};
        var options = (( proto.options = proto.options || {} ));

        var base = this.get(options.base || '');

        var that = this;

        var mixin;
        if (options.mixin) {
            mixin = options.mixin.split(' ').map(function(id) {
                return that.asts[id];
            });
        } else {
            mixin = [];
        }
        //  FIXME: А тут не unshift должен быть?
        //  mixin.push(proto);
        mixin.unshift(proto);

        yate.inherit(ctor, base, mixin);

        ctor.prototype.id = id;
        ctor.prototype.factory = this;

        if (options.props) {
            var props = options.props.split(' ');

            ctor.prototype.copy = gen_copy(props);
            ctor.prototype.apply = gen_apply(props);
            ctor.prototype.dowalk = gen_dowalk(props);
            ctor.prototype.walkdo = gen_walkdo(props);
        }

        this.ctors[id] = ctor;
    }

    return ctor;
};

function gen_copy(props) {
    var r = 'var p;';
    for (var i = 0, l = props.length; i < l; i++) {
        var prop = JSON.stringify( props[i] );

        r += 'p = ast[' + prop + '];';
        r += 'if (p != null) { this[' + prop + '] = p; }';
    }

    return Function('ast', r);
};

function gen_apply(props) {
    var r = 'var v;';
    for (var i = 0, l = props.length; i < l; i++) {
        var prop = JSON.stringify( props[i] );

        r += 'v = this[' + prop + '];';
        r += 'if (v instanceof yate.AST) { callback(v, params); }';
    }

    return Function('callback', 'params', r);
};

function gen_dowalk(props) {
    var r = 'var v;';

    r += 'if (this.id === "jpath_nametest") { console.log("FOO"); }';
    r += 'callback(this, params, pkey, pvalue);';

    for (var i = 0, l = props.length; i < l; i++) {
        var prop = JSON.stringify( props[i] );

        r += 'v = this[' + prop + '];';
        r += 'if (v instanceof yate.AST) { v.dowalk(callback, params, ' + prop + ', this); }';
    }

    return Function('callback', 'params', 'pkey', 'pvalue', r);
};

function gen_walkdo(props) {
    var r = 'var v;';

    for (var i = 0, l = props.length; i < l; i++) {
        var prop = JSON.stringify( props[i] );

        r += 'v = this[' + prop + '];';
        r += 'if (v instanceof yate.AST) { v.walkdo(callback, params, ' + prop + ', this); }';
    }

    r += 'callback(this, params, pkey, pvalue);';

    return Function('callback', 'params', 'pkey', 'pvalue', r);
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = new Factory(asts);

//  ---------------------------------------------------------------------------------------------------------------  //

