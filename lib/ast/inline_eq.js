var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_eq = {};

AST.inline_eq.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

AST.inline_eq.options = {
    base: 'inline_op'
};

