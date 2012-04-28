//  ---------------------------------------------------------------------------------------------------------------  //
//  Factory
//  ---------------------------------------------------------------------------------------------------------------  //

var common = require('./common.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var Factory = function(base, asts) {
    this.asts = asts;
    this.ctors = {
        '': base
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

Factory.prototype.make = function(id, params) {
    var ctor = this.get(id);
    var ast = new ctor();
    ast._init(params);

    return ast;
};

Factory.prototype.get = function(id) {
    var ctor = this.ctors[id];

    if (!ctor) {
        ctor = function() {};

        var proto = this.asts[id] || {};
        var options = proto.options = proto.options || {};

        var base = this.get(options.base || '');

        var mixin = [];
        if (options.mixin) {
            options.mixin = common.makeArray(options.mixin);
            var that = this;
            mixin = options.mixin.map(function(id) {
                return that.asts[id] || {};
            });
        }
        mixin.push(proto);

        common.inherit(ctor, base, mixin);

        ctor.prototype.id = id;
        ctor.prototype.factory = this;

        this.ctors[id] = ctor;
    }

    return ctor;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Factory;

//  ---------------------------------------------------------------------------------------------------------------  //

