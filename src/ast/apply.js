Yate.AST.apply = {

    options: {
        base: 'expr'
    },

    _type: Yate.Types.UNDEF,

    validate: function() {
        if (!this.Expr.type( Yate.Types.NODESET )) {
            this.error('Type of expression should be NODESET');
        }
    },

    isOpen: function() {
        return undefined;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

