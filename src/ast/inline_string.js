yate.AST.inline_string = {

    options: {
        base: 'inline_expr'
    },

    _type: yate.types.SCALAR,

    prepare: function() {
        this.Value.cast(yate.types.SCALAR);
    },

    toResult: function(result) {
        this.Value.toResult(result);
    }

};

