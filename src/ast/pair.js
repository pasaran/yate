yate.AST.pair = {

    _type: yate.Types.PAIR,

    prepare: function() {
        this.Key.cast(yate.Types.SCALAR);
        this.Value.toValue();
    }

};

