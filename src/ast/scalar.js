yate.AST.scalar = {

    _type: yate.types.SCALAR,

    prepare: function() {
        this.Body.cast(yate.types.SCALAR);
        if (this.AsListItem) {
            this.Body.rid();
        }
    }

};

