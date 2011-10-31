yate.AST.inline_scalar = {};

yate.AST.inline_scalar.options = {
    base: 'inline_expr',
    mixin: 'items'
};

yate.AST.inline_scalar.oncast = function(to) {
    this.Expr.cast(to);
};

