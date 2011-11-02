yate.AST.cast = {};

yate.AST.cast.options = {
    base: 'inline_expr'
};

yate.AST.cast._init = function(to, expr) {
    this.From = expr.type();
    this.To = to;
    this.Expr = expr;
    this.mode = expr.mode;
};

yate.AST.cast._getType = function() {
    return this.To;
};

