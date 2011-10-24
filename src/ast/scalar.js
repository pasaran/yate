yate.AST.scalar = {

    _type: yate.Types.SCALAR,

    prepare: function() {
        this.Body.cast(yate.Types.SCALAR);
        if (this.AsListItem) {
            this.Body.rid();
        }
    }

};

