var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.if_ = {};

AST.if_.options = {
    base: 'expr'
};

AST.if_._getType = function() {
    var thenType = this.Then.type();
    var elseType = (this.Else) ? this.Else.type() : 'undef';

    return yate.types.commonType(thenType, elseType);
};

AST.if_.setTypes = function() {
    this.Condition.cast('boolean');
};

AST.if_.oncast = function(to) {
    this.Then.cast(to);
    if (this.Else) {
        this.Else.cast(to);
    }
};

AST.if_.closes = function() {
    if (!this.Else) {
        return this.Then.closes();
    }
    return this.Then.closes() && this.Else.closes();
};

AST.if_.setPrevOpened = function(prevOpened) {
    this.Then.setPrevOpened(prevOpened);
    if (this.Else) {
        this.Else.setPrevOpened(prevOpened);
    }
};

