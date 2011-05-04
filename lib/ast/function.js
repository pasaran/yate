Yate.AST.function_ = {

    options: {
        locals: {
            scope: true
        }
    },

    action: function() {
        var functions = this.parent.scope.functions;
        var name = this.$name;
        if (functions[name]) {
            this.error('Повторное определение функции или ключа ' + this.$name);
        }

        this.$fid = this.state.fid++;
        this.$type = Yate.AST.functionType.USER;

        functions[name] = this;
    },

    validate: function() {
        if (this.$body.type() === Yate.Types.UNDEF) {
            this.error('Undefined type of return value');
        }
    },

    _getType: function() {
        return this.$body.type();
    },

    prepare: function() {
        this.$body.cast();
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
        var name = this.$name;
        if (vars[name]) {
            this.error('Повторное определение аргумента ' + this.$name);
        }

        this.$vid = this.state.vid++;
        this.$type = Yate.AST.varType.ARGUMENT;

        vars[name] = this;
    },

    _getType: function() {
        if (this.$typedef == 'nodeset') { return Yate.Types.NODESET; }
        if (this.$typedef == 'boolean') { return Yate.Types.BOOLEAN; }
        return Yate.Types.SCALAR;
    }

};

