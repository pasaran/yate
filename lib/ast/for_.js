var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.for_ = {};

AST.for_.options = {
    base: 'expr'
};

AST.for_._getType = function() {
    var type = this.Body.type();

    return yate.types.joinType(type, type);
};

AST.for_.oncast = function(to) {
    this.Body.cast(to);
};

AST.for_.prepare = function() {
    this.Body.cid();
};

AST.for_.closes = function() {
    return this.Body.closes();
};

AST.for_.setPrevOpened = function(prevOpened) {
    this.Body.setPrevOpened(prevOpened);
};

