yate.AST.for_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var type = this.Body.type();

        return yate.Types.joinType(type, type);
    },

    oncast: function(to) {
        this.Body.cast(to);
    },

    prepare: function() {
        if (this.AsListItem && !this.Body.AsList) {
            this.Body.rid();
        }
        this.Body.cid();
    }

};

