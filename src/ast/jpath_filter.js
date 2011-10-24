yate.AST.jpath_filter = {

    options: {
        base: 'inline_expr'
    },

    _init: function(expr, predicates) {
        this.Expr = expr;
        this.Predicates = predicates;
    },

    _type: yate.Types.NODESET,

    validate: function() {
        if (!this.Expr.type( yate.Types.NODESET )) {
            this.Expr.error('Type should be NODESET');
        }
    }

};

