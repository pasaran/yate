yate.AST.pair = {};

yate.AST.pair._type = 'pair',

yate.AST.pair.prepare = function() {
    this.Key.cast('scalar');
    this.Value.toValue();
};

