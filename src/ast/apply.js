yate.AST.apply = {

    options: {
        base: 'expr'
    },

    _type: yate.types.UNDEF,

    validate: function() {
        if (!this.Expr.type( yate.types.NODESET )) {
            this.error('Type of expression should be NODESET');
        }
    },

    isOpen: function() {
        return undefined;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

