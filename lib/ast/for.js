Yate.AST.for_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var type = this.Body.type();

        return Yate.Types.joinType(type, type);
    },

    oncast: function(to) {
        this.Body.cast(to);
    }

};

