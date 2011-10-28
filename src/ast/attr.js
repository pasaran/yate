yate.AST.attr = {

    options: {
        base: 'xml'
    },

    _type: yate.types.ATTR,

    prepare: function() {
        if (!this.Value.inline()) {
            this.Value.rid();
        }
        this.Value.cast(yate.types.SCALAR);
        this.Value.trigger('set', 'mode', 'attr'); // FIXME: Непонятно, нужно ли тут квотить что-то?
                                                   //        Или же оно в runtime должно заквотиться в attrs_close?
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

