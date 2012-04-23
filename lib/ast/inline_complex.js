var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_complex = {};

AST.inline_complex.options = {
    base: 'inline_expr'
};

AST.inline_complex.isLocal = function() {
    return this.Expr.isLocal();
};

AST.inline_complex._getType = function() {
    return this.Expr.type();
};

