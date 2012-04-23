var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_rel = {};

AST.inline_rel.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

AST.inline_rel.options = {
    base: 'inline_op'
};

