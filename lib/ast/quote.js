var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.quote = {};

AST.quote.options = {
    base: 'inline_expr'
};

AST.quote._init = function(expr, mode) {
    this.Expr = expr;
    this.Mode = mode;
};

