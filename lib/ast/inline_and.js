var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_and = {};

AST.inline_and.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

AST.inline_and.options = {
    base: 'inline_op'
};

