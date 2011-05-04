Yate.AST.if_ = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        var thenType = this.$then.type();
        var elseType = (this.$else) ? this.$else.type() : null;

        /*
        if (thenType === Yate.Types.XML) { return Yate.Types.XML; }
        if (thenType === elseType) { return thenType; }

        if (!elseType) { return Yate.Types.SCALAR; }

        return Yate.Types.commonType(thenType, elseType);
        */

        return elseType ? Yate.Types.commonType(thenType, elseType) : thenType;
    },

    oncast: function(from, to) {
        this.$condition = this.$condition.cast(Yate.Types.BOOLEAN);

        this.$then = this.$then.cast(to);
        if (this.$else) {
            this.$else = this.$else.cast(to);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

