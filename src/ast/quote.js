yate.AST.quote = {};

yate.AST.quote.options = {
    base: 'inline_expr'
};

yate.AST.quote._init = function(expr, mode) {
    this.Expr = expr;
    this.Mode = mode;
};

