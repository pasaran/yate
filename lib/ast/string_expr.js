var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.string_expr = {};

AST.string_expr.options = {
    base: 'inline_expr'
};

AST.string_expr._init = function(expr) {
    this.Expr = expr;
};

AST.string_expr._getType = function() {
    return this.Expr.type();
};

