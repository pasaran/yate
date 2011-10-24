yate.AST.pair = {

    _type: yate.types.PAIR,

    prepare: function() {
        this.Key.cast(yate.types.SCALAR);
        this.Value.toValue();
    }

};

