yate.AST.jpath_filter = {

    options: {
        base: 'inline_expr'
    },

    _init: function(expr, predicates) {
        this.Expr = expr;
        this.Predicates = predicates;
    },

    _type: yate.types.NODESET,

    validate: function() {
        if (!this.Expr.type( yate.types.NODESET )) {
            this.Expr.error('Type should be NODESET');
        }
    }

};

