Yate.AST.argListItem = {

    action: function() {
        var vars = this.parent.scope.vars;
        var name = this.Name;
        if (vars[name]) {
            this.error('Повторное определение аргумента ' + this.Name);
        }

        this.Vid = this.state.vid++;
        this.Type = Yate.AST.varType.ARGUMENT;

        vars[name] = this;
    },

    _getType: function() {
        if (this.Typedef == 'nodeset') { return Yate.Types.NODESET; }
        if (this.Typedef == 'boolean') { return Yate.Types.BOOLEAN; }
        return Yate.Types.SCALAR;
    }

};

