Yate.AST.function_ = {

    options: {
        locals: {
            scope: true
        }
    },

    action: function() {
        var functions = this.parent.scope.functions;
        var name = this.Name;
        if (functions[name]) {
            this.error('Повторное определение функции или ключа ' + this.Name);
        }

        this.Fid = this.state.fid++;
        this.Type = Yate.AST.functionType.USER;

        functions[name] = this;
    },

    validate: function() {
        if (this.Body.type() === Yate.Types.UNDEF) {
            this.error('Undefined type of return value');
        }
    },

    _getType: function() {
        return this.Body.type();
    },

    prepare: function() {
        this.Body.cast();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.argList = {

    options: {
        mixin: 'items'
    }

};

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

