Yate.AST.if_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var thenType = this.Then.type();
        var elseType = (this.Else) ? this.Else.type() : null;

        /*
        if (thenType === Yate.Types.XML) { return Yate.Types.XML; }
        if (thenType === elseType) { return thenType; }

        if (!elseType) { return Yate.Types.SCALAR; }

        return Yate.Types.commonType(thenType, elseType);
        */

        return elseType ? Yate.Types.commonType(thenType, elseType) : thenType;
    },

    oncast: function(from, to) {
        this.Condition = this.Condition.cast(Yate.Types.BOOLEAN);

        this.Then = this.Then.cast(to);
        if (this.Else) {
            this.Else = this.Else.cast(to);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

