yate.AST.jpath_filter = {};

yate.AST.jpath_filter.options = {
    base: 'inline_expr'
};

yate.AST.jpath_filter._init = function(expr, jpath) {
    this.Expr = expr;
    this.JPath = jpath;
};

yate.AST.jpath_filter._type = 'nodeset',

yate.AST.jpath_filter.isLocal = function() {
    return this.Expr.isLocal() || this.JPath.isLocal();
};

yate.AST.jpath_filter.getScope = function() {
    return yate.Scope.commonScope( this.Expr.getScope(), this.JPath.getScope() );
};

yate.AST.jpath_filter.validate = function() {
    if (!this.Expr.type( 'nodeset' )) {
        this.Expr.error('Type should be NODESET');
    }
};

