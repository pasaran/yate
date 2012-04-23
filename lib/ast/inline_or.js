var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_or = {};

AST.inline_or.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

AST.inline_or.options = {
    base: 'inline_op'
};

