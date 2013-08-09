var yate = require('./yate.js');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

require('./ast.js');

var asts = require('./asts.js');
require('./asts.items.js');
require('./asts.xml.js');
require('./asts.inline.js');
require('./asts.jpath.js');
require('./asts.block.js');

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

    //  Вызываем "конструктор". Настоящие конструктор пустой для упрощения наследования.
    //
    //  FIXME: Нужно отличать конструктор от "конструктора копии".
    //
    if (ast._init) {
        ast._init(params);
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

        this.ctors[id] = ctor;
    }

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.factory = new Factory(
    {
        '': yate.AST
    },
    asts
);

//  ---------------------------------------------------------------------------------------------------------------  //

