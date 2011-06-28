Yate.AST.cast = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(to, expr) {
        this.From = expr.type();
        this.To = to;
        this.Expr = expr;
        this.mode = expr.mode;
    },

    _getType: function() {
        return this.To;
    }

};

