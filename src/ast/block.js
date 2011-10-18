Yate.AST.block = {

    options: {
        locals: {
            scope: true
        },
        order: [ 'Defs', 'Templates', 'Exprs', 'AsList' ]
    },

    _init: function(exprs) {
        this.Defs = Yate.AST.make('block_defs');
        this.Templates = Yate.AST.make('block_templates');
        this.Exprs = Yate.AST.make('block_exprs', exprs);
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

