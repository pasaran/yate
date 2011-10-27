yate.AST.inline_var = {};

yate.AST.inline_var.options = {
    base: 'inline_expr'
};

yate.AST.inline_var.action = function() {
    this.def = this.scope.findVar(this.Name);
    if (!this.def) {
        this.error('Undefined variable ' + this.Name);
    }
};

yate.AST.inline_var._getType = function() {
    return this.def.type();
};

yate.AST.inline_var.isLocal = yate.false;

yate.AST.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.Name).scope;
};

