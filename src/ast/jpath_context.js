Yate.AST.jpath_context = {

    options: {
        base: 'inline_expr'
    },

    _init: function(context, jpath) {
        this.Context = context;
        this.JPath = jpath;
    },

    _type: Yate.Types.NODESET,

    validate: function() {
        if (!this.Context.type( Yate.Types.NODESET )) {
            this.Context.error('Type should be NODESET');
        }
    }

};

