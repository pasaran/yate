var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate.Scope
//  ---------------------------------------------------------------------------------------------------------------  //

yate.Scope = function() {
    this.id = yate.Scope._id++;

    this.defs = [];

    this.vars = {};
    this.functions = {};
    this.jkeys = {};
    this.pkeys = {};
};

yate.Scope._id = 0;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Scope.prototype.child = function() {
    var local = new this.constructor();
    local.parent = this;
    return local;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Scope.prototype.findVar = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.vars[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
};

yate.Scope.prototype.findFunction = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.functions[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Scope.prototype.top = function() {
    var top = this;
    while (top.parent) {
        top = top.parent;
    }
    return top;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Scope.prototype.inScope = function(scope) {
    var that = this;

    while (that) {
        if (that === scope) { return true; }
        that = that.parent;
    }

    return false;
};

yate.Scope.commonScope = function(a, b) {
    return (a.inScope(b)) ? a : b;
};

//  ---------------------------------------------------------------------------------------------------------------  //

