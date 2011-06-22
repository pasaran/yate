Yate.AST.scalar = {

    _type: Yate.Types.SCALAR,

    prepare: function() {
        if (this.Expr.inline()) {
            this.Inline = true;
        } else {
            this.Expr.trigger('set', 'Rid', this.Expr.Rid + 1);
        }
    }

};

