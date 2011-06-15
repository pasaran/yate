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
    },

    oncast: function(to) {
        this.Then.cast(to);
        if (this.Else) {
            this.Else.cast(to);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

