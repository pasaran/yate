var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_mul = {};

AST.inline_mul.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

AST.inline_mul.options = {
    base: 'inline_op'
};

