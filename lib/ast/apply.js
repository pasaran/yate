Yate.AST.apply = {

    options: {
        base: 'expr'
    },

    _type: Yate.Types.XML,

    validate: function() {
        if (!Yate.Types.convertable(this.$expr.type(), Yate.Types.NODESET)) {
            this.error('Type of expression should be NODESET');
        }
    },

    isOpen: function() {
        return undefined;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

