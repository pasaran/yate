Yate.AST.scalar = {

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.Expr.cast(Yate.Types.SCALAR);

        if (this.Expr.inline()) {
            this.Inline = true;
        } else {
            this.Expr.trigger('set', 'Rid', this.Expr.Rid + 1);
        }
    },

    inline: function() {
        return this.Expr.inline();
    }

};

