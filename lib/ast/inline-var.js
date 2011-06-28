Yate.AST.inlineVar = {

    options: {
        base: 'inlineExpr'
    },

    action: function() {
        this.def = this.scope.findVar(this.Name);
        this.Vid = this.def.Vid;
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

