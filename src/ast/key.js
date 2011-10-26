yate.AST.key = {

    action: function() {
        var functions = this.scope.functions;
        var name = this.Name;

        if (functions[name]) {
            this.error('Повторное определение функции или ключа ' + name);
        }

        this.Kid = this.state.kid++;
        this.Type = yate.AST.function_type.KEY;

        functions[name] = this;
    },

    validate: function() {
        if (!this.Nodes.type( yate.types.NODESET )) {
            this.Nodes.error('Nodeset is required');
        }
        if (!this.Use.type( yate.types.SCALAR )) {
            this.Use.error('Scalar is required');
        }
    },

    _getType: function() {
        return this.Body.type();
    }

};

