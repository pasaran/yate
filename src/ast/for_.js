yate.AST.for_ = {};

yate.AST.for_.options = {
    base: 'expr'
};

yate.AST.for_._getType = function() {
    var type = this.Body.type();

    return yate.types.joinType(type, type);
};

yate.AST.for_.oncast = function(to) {
    this.Body.cast(to);
};

yate.AST.for_.prepare = function() {
    this.Body.cid();
};

yate.AST.for_.closes = function() {
    return this.Body.closes();
};

yate.AST.for_.setPrevOpened = function(prevOpened) {
    this.Body.setPrevOpened(prevOpened);
};

