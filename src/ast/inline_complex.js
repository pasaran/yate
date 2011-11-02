yate.AST.inline_complex = {};

yate.AST.inline_complex.options = {
    base: 'inline_expr'
};

yate.AST.inline_complex.isLocal = function() {
    return this.Expr.isLocal();
};

yate.AST.inline_complex._getType = function() {
    return this.Expr.type();
};

