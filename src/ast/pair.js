yate.AST.pair = {};

yate.AST.pair._type = yate.types.PAIR,

yate.AST.pair.prepare = function() {
    this.Key.cast(yate.types.SCALAR);
    this.Value.toValue();
};

