var common = require('./common.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var ASTS = function(Base, protos) {
    this.protos = protos;
    this.ctors = {};
    this.ctors[''] = Base;
};

//  ---------------------------------------------------------------------------------------------------------------  //

ASTS.prototype.make = function(id, params) {
    var ctor = this.get(id);
    var ast = new ctor();
    ast._init(params);

    return ast;
};

ASTS.prototype.get = function(id) {
    var ctor = this.ctors[id];

    if (!ctor) {
        ctor = function() {};

        var proto = this.protos[id] || {};
        var options = proto.options = proto.options || {};

        var base = this.get(options.base || '');

        var mixin = [];
        if (options.mixin) {
            options.mixin = common.makeArray(options.mixin);
            var that = this;
            mixin = mixin.concat( options.mixin.map(function(id) {
                return that.protos[id] || {};
            }) );
        }
        mixin.push(proto);

        common.inherit(ctor, base, mixin);

        ctor.prototype.id = id;
        ctor.prototype.ASTS = this;

        this.ctors[id] = ctor;
    }

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = ASTS;

//  ---------------------------------------------------------------------------------------------------------------  //

