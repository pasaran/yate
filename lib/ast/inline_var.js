var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_var = {};

AST.inline_var.options = {
    base: 'inline_expr'
};

AST.inline_var.action = function() {
    this.def = this.scope.findVar(this.Name);
    if (!this.def) {
        this.error('Undefined variable ' + this.Name);
    }
};

AST.inline_var._getType = function() {
    return this.def.type();
};

AST.inline_var.isLocal = yate.false;

AST.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.Name).scope;
};

