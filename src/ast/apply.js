yate.AST.apply = {

    options: {
        base: 'expr'
    },

    _type: yate.Types.UNDEF,

    validate: function() {
        if (!this.Expr.type( yate.Types.NODESET )) {
            this.error('Type of expression should be NODESET');
        }
    },

    isOpen: function() {
        return undefined;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

