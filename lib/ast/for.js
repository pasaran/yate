Yate.AST.for_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var type = this.$body.type();
        if (type === Yate.Types.ATTR || type === Yate.Types.XML) {
            return type;
        }
        return Yate.Types.SCALAR;
    },

    oncast: function(from, to) {
        this.$body.cast(to);
    }

};

