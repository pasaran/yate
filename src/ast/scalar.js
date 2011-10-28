yate.AST.scalar = {

    _type: yate.types.SCALAR,

    prepare: function() {
        this.Block.cast(yate.types.SCALAR);
        if (this.AsListItem) {
            this.Block.rid();
        }
    }

};

