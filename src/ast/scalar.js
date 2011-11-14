yate.AST.scalar = {};

yate.AST.scalar._getType = function() {
    return this.Block.type();
};

yate.AST.scalar.oncast = function(to) {
    this.Block.cast(to);
};

yate.AST.scalar.closes = function() {
    return this.Block.closes();
};

yate.AST.scalar.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

