yate.AST.attr = {

    options: {
        base: 'xml'
    },

    _type: yate.types.ATTR,

    prepare: function() {
        if (!this.Expr.inline()) {
            this.Expr.rid();
        }
        this.Expr.cast(yate.types.SCALAR);
        this.Expr.trigger('set', 'mode', 'attr'); // FIXME: Непонятно, нужно ли тут квотить что-то?
                                                  //        Или же оно в runtime должно заквотиться в attrs_close?
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

