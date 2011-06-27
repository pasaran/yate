Yate.AST.if_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var thenType = this.Then.type();
        var elseType = (this.Else) ? this.Else.type() : Yate.Types.UNDEF;

        return Yate.Types.commonType(thenType, elseType);
    },

    prepare: function() {
        this.Condition.cast(Yate.Types.BOOLEAN);

        if (this.AsListItem) {
            this.Then.trigger('set', 'Rid', this.Then.Rid + 1);
            if (this.Else) {
                this.Else.trigger('set', 'Rid', this.Else.Rid + 1);
            }
        }
    },

    oncast: function(to) {
        this.Then.cast(to);
        if (this.Else) {
            this.Else.cast(to);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

