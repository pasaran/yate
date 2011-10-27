yate.AST.jpath_filter = {

    options: {
        base: 'inline_expr'
    },

    _init: function(expr, jpath) {
        this.Expr = expr;
        this.JPath = jpath;
    },

    _type: yate.types.NODESET,

    isLocal: function() {
        return this.Expr.isLocal() || this.JPath.isLocal();
    },

    validate: function() {
        if (!this.Expr.type( yate.types.NODESET )) {
            this.Expr.error('Type should be NODESET');
        }
    }

};

