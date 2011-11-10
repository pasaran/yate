yate.AST.scalar = {};

yate.AST.scalar._getType = function() {
    return this.Block.type();
};

yate.AST.scalar.prepare = function() {
    /*
    if (this.AsListItem) {
        this.Block.rid();
    }
    */
};

yate.AST.scalar.oncast = function(to) {
    this.Block.cast(to);
};

yate.AST.scalar.closes = function() {
    return ( this.type() != 'attr' ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

