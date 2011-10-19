Yate.AST.inline_complex = {

    options: {
        base: 'inline_expr'
    },

    isLocal: function() {
        return this.Expr.isLocal();
    },

    _getType: function() {
        return this.Expr.type();
    }

};

