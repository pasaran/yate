var yate = require('./yate.js');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

require('./ast.js');

var asts = require('./asts.js');

//  ---------------------------------------------------------------------------------------------------------------  //

function Factory(ctors, asts) {
    this.asts = asts;
    this.ctors = ctors;
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
    if (params && ast._copy) {
        ast._copy(params);
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

        var mixin = no.array.map(
            no.array(options.mixin),
            function(id) {
                return that.asts[id];
            }
        );
        //  FIXME: А тут не unshift должен быть?
        //  mixin.push(proto);
        mixin.unshift(proto);

        no.inherit(ctor, base, mixin);

        ctor.prototype.id = id;
        ctor.prototype.factory = this;

        if (options.props) {
            var props = options.props.split(' ');

            if (!ctor.prototype._copy) {
                ctor.prototype._copy = gen_copy(props);
            }
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

//  ---------------------------------------------------------------------------------------------------------------  //

yate.factory = new Factory(
    {
        '': yate.AST
    },
    asts
);

//  ---------------------------------------------------------------------------------------------------------------  //

