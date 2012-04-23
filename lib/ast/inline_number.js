var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_number = {};

AST.inline_number.options = {
    base: 'inline_expr'
};

AST.inline_number.isLocal = yate.false;

AST.inline_number._type = 'scalar';

