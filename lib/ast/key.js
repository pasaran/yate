Yate.AST.key = {

    action: function() {
        var functions = this.parent.scope.functions;
        var name = this.Name;
        if (functions[name]) {
            this.error('Повторное определение функции или ключа ' + this.Name);
        }

        this.Kid = this.state.kid++;
        this.Type = Yate.AST.functionType.KEY;

        functions[name] = this;
    },

    validate: function() {
        if (!Yate.Types.convertable(this.Nodes.type(), Yate.Types.NODESET)) {
            this.Nodes.error('Nodeset is required');
        }
        if (!Yate.Types.convertable(this.Use.type(), Yate.Types.SCALAR)) {
            this.Use.error('Scalar is required');
        }
    },

    _getType: function() {
        return this.Body.type();
    }

};

