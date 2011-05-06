Yate.AST.attr = {

    options: {
        base: 'xml'
    },

    _type: Yate.Types.ATTR,

    prepare: function() {
        this.$expr = this.$expr.cast(Yate.Types.SCALAR);
        this.$expr.trigger('set', 'mode', 'attr'); // FIXME: Непонятно, нужно ли тут квотить что-то?
                                                   //        Или же оно в runtime должно заквотиться в closeAttrs?
    },

    oncast: function() {
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

