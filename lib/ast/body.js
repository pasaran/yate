var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.body = {};

AST.body._getType = function() {
    return this.Block.type();
};

AST.body.closes = function() {
    return this.Block.closes();
};

AST.body.oncast = function(to) {
    this.Block.cast(to);
};

AST.body.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

