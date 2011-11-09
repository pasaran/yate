yate.AST.inline_scalar = {};

yate.AST.inline_scalar.options = {
    base: 'inline_expr'
};

yate.AST.inline_scalar.oncast = function(to) {
    this.AsType = null;
    this.Expr.cast(to);
};

yate.AST.inline_scalar._getType = function() {
    return this.Expr.type();
};

yate.AST.inline_scalar.closes = function() {
    return ( this.type() != yate.types.ATTR ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

