Yate.AST.inline_string = {

    options: {
        base: 'inline_expr'
    },

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.Value.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Value.toResult(result);
    }

};

