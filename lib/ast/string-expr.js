Yate.AST.stringExpr = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr) {
        this.Expr = expr;
    },

    _getType: function() {
        return this.Expr.type();
    }

};

