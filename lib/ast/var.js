Yate.AST.var_ = {

    action: function() {
        var vars = this.parent.scope.vars;
        var name = this.$name;

        var var_ = vars[name];
        if (var_ && var_.$type != Yate.AST.varType.ARGUMENT) { // Переменная может переопределить аргумент.
            this.error('Повторное определение переменной ' + this.$name);
        }

        this.$vid = this.state.vid++;
        this.$type = Yate.AST.varType.USER;

        vars[name] = this;
    },

    _getType: function() {
        return this.$value.type();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

