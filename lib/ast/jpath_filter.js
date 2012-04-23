var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.jpath_filter = {};

AST.jpath_filter.options = {
    base: 'inline_expr'
};

AST.jpath_filter._init = function(expr, jpath) {
    this.Expr = expr;
    this.JPath = jpath;
};

AST.jpath_filter._type = 'nodeset',

AST.jpath_filter.isLocal = function() {
    return this.Expr.isLocal() || this.JPath.isLocal();
};

AST.jpath_filter.getScope = function() {
    return yate.Scope.commonScope( this.Expr.getScope(), this.JPath.getScope() );
};

AST.jpath_filter.validate = function() {
    if (!this.Expr.type( 'nodeset' )) {
        this.Expr.error('Type should be NODESET');
    }
};

