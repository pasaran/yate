yate.AST.inline_scalar = {};

yate.AST.inline_scalar.options = {
    base: 'inline_expr'
};

yate.AST.inline_scalar.oncast = function(to) {
    this.Expr.cast(to);
};

yate.AST.inline_scalar._getType = function() {
    return this.Expr.type();
};

