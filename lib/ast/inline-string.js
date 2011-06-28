Yate.AST.inlineString = {

    options: {
        base: 'inlineExpr'
    },

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.Value.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Value.toResult(result);
    }

};

