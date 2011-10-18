Yate.AST.inline_var = {

    options: {
        base: 'inline_expr'
    },

    action: function() {
        this.def = this.scope.findVar(this.Name);
    },

    _getType: function() {
        return this.def.type();
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined variable ' + this.Name);
        }
    }

};

