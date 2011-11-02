yate.AST.body = {};

yate.AST.body._getType = function() {
    return this.Block.type();
};

yate.AST.body.closes = function() {
    return this.Block.closes();
};

yate.AST.body.oncast = function(to) {
    this.Block.cast(to);
};

