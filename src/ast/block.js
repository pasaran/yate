Yate.AST.block = {

    options: {
        locals: {
            scope: true
        },
        order: [ 'Defs', 'Templates', 'Exprs', 'AsList' ]
    },

    _init: function(exprs) {
        this.Defs = Yate.AST.make('blockDefs');
        this.Templates = Yate.AST.make('blockTemplates');
        this.Exprs = Yate.AST.make('blockExprs', exprs);
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

