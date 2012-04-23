var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_add = {};

AST.inline_add.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

AST.inline_add.options = {
    base: 'inline_op'
};

