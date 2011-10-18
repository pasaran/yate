Yate.AST.inline_index = {

    options: {
        base: 'inline_expr'
    },

    _init: function(expr, index) {
        this.Expr = expr;
        this.Index = index;
    },

    _type: Yate.Types.NODESET,

    validate: function() {
        if (!this.Expr.type( Yate.Types.NODESET )) {
            this.Expr.error('Type should be NODESET');
        }
    },

    prepare: function() {
        this.Index = this.Index.cast(Yate.Types.SCALAR);
    }

};

