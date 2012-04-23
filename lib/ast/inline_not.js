var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_not = {};

AST.inline_not.signature = {
    left: 'boolean',
    result: 'boolean'
};

AST.inline_not.options = {
    base: 'inline_op'
};

