Yate.AST.var_ = {

    action: function() {
        var vars = this.parent.scope.vars;
        var name = this.Name;

        var var_ = vars[name];
        if (var_ && var_.Type != Yate.AST.var_type.ARGUMENT) { // Переменная может переопределить аргумент.
            this.error('Повторное определение переменной ' + this.Name);
        }

        this.Vid = this.state.vid++;
        this.Type = Yate.AST.var_type.USER;

        vars[name] = this;
    },

    _getType: function() {
        return this.Value.type();
    },

    prepare: function() {
        this.Value.cast();
        this.Value.rid();
    }

};

