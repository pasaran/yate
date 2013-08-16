function Scope() {
    this.id = Scope._id++;

    this.defs = [];

    this.vars = {};
    this.functions = {};
    this.jkeys = {};
    this.pkeys = {};
}

Scope._id = 0;

//  ---------------------------------------------------------------------------------------------------------------  //

Scope.prototype.child = function() {
    var local = new this.constructor();
    local.parent = this;
    return local;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Scope.prototype.findVar = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.vars[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
};

Scope.prototype.findFunction = function(name) {
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

Scope.prototype.top = function() {
    var top = this;
    while (top.parent) {
        top = top.parent;
    }
    return top;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Scope.prototype.inScope = function(scope) {
    var that = this;

    while (that) {
        if (that === scope) { return true; }
        that = that.parent;
    }

    return false;
};

Scope.commonScope = function(a, b) {
    return (a.inScope(b)) ? a : b;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Scope;

//  ---------------------------------------------------------------------------------------------------------------  //


