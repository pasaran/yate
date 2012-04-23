var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_unary = {};

AST.inline_unary.signature = {
    left: 'scalar',
    result: 'scalar'
};

AST.inline_unary.options = {
    base: 'inline_op'
};

