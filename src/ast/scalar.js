yate.AST.scalar = {};

yate.AST.scalar._type = yate.types.SCALAR;

yate.AST.scalar.prepare = function() {
    this.Block.cast(yate.types.SCALAR);
    if (this.AsListItem) {
        this.Block.rid();
    }
};

