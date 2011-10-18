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
        this.Type = Yate.AST.function_type.USER;

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
        var body = this.Body;
        body.cast( body.type() );
    }

};

