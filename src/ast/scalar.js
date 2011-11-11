yate.AST.scalar = {};

yate.AST.scalar._getType = function() {
    return this.Block.type();
};

yate.AST.scalar.oncast = function(to) {
    this.Block.cast(to);
};

yate.AST.scalar.closes = function() {
    // FIXME: Или нужно так: return this.Block.closes(); ?
    return ( this.type() != 'attr' ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

