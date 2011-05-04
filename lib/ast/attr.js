Yate.AST.attr = {

    options: {
        base: 'xml'
    },

    _type: Yate.Types.ATTR,

    prepare: function() {
        this.$expr = this.$expr.cast(Yate.Types.SCALAR);
    },

    oncast: function() {
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

