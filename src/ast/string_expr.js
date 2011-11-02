yate.AST.string_expr = {};

yate.AST.string_expr.options = {
    base: 'inline_expr'
};

yate.AST.string_expr._init = function(expr) {
    this.Expr = expr;
};

yate.AST.string_expr._getType = function() {
    return this.Expr.type();
};

