var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.apply = {};

AST.apply.options = {
    base: 'expr'
};

AST.apply._type = 'xml';

AST.apply.validate = function() {
    if (!this.Expr.type( 'nodeset' )) {
        this.error('Type of expression should be NODESET');
    }
};

AST.apply.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

