yate.AST.scalar = {};

// yate.AST.scalar._type = yate.types.SCALAR;

yate.AST.scalar._getType = function() {
    return this.Block.type();
};

yate.AST.scalar.prepare = function() {
    //// this.Block.cast(yate.types.SCALAR);
    this.Block.cast();
    if (this.AsListItem) {
        this.Block.rid();
    }
};

