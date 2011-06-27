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
    },

    prepare: function() {
        if (this.AsListItem && !this.Body.AsList) {
            this.Body.trigger('set', 'Rid', this.Body.Rid + 1);
        }
    }

};

