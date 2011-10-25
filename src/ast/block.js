yate.AST.block = {

    options: {
        scope: true,
        order: [ 'Defs', 'Templates', 'Exprs', 'AsList' ]
    },

    _init: function(exprs) {
        this.Defs = yate.AST.make('block_defs');
        this.Templates = yate.AST.make('block_templates');
        this.Exprs = yate.AST.make('block_exprs', exprs);
    },

    _getType: function() {
        return this.Exprs.type();
    },

    action: function() {
        this.Exprs.AsList = this.AsList;

        if ( this.Defs.empty() && this.Templates.empty() && this.Exprs.inline() ) {
            this.Inline = true;
        }
    },

    oncast: function(to) {
        this.Exprs.cast(to);
    }

};

