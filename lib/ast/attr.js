var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.attr = {};

AST.attr.options = {
    base: 'xml'
};

AST.attr._type = 'attr';

AST.attr.setTypes = function() {
    this.Value.cast('scalar');
};

AST.attr.prepare = function() {
    if (!this.Value.inline()) {
        this.Value.rid();
    }
};

AST.attr.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

