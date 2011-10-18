Yate.AST.string_expr = {

    options: {
        base: 'inline_expr'
    },

    _init: function(expr) {
        this.Expr = expr;
    },

    _getType: function() {
        return this.Expr.type();
    }

};

