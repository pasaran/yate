yate.AST.inline_string = {

    options: {
        base: 'inline_expr'
    },

    _type: yate.Types.SCALAR,

    prepare: function() {
        this.Value.cast(yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Value.toResult(result);
    }

};

