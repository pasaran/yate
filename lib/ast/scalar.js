Yate.AST.scalar = {

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.Body.cast(Yate.Types.SCALAR);
        if (this.AsListItem) {
            this.Body.rid();
        }
    }

};

