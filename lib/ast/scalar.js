var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.scalar = {};

AST.scalar._getType = function() {
    return this.Block.type();
};

AST.scalar.oncast = function(to) {
    this.Block.cast(to);
};

AST.scalar.closes = function() {
    return this.Block.closes();
};

AST.scalar.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

