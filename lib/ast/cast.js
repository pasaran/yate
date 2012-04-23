var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.cast = {};

AST.cast.options = {
    base: 'inline_expr'
};

AST.cast._init = function(to, expr) {
    this.From = expr.type();
    this.To = to;
    this.Expr = expr;
    this.mode = expr.mode;
};

AST.cast._getType = function() {
    return this.To;
};

