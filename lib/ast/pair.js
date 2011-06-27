
Yate.AST.pair = {

    _type: Yate.Types.PAIR,

    prepare: function() {
        this.Key.cast(Yate.Types.SCALAR);
        this.Value.toValue();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

