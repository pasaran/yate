Yate.AST.key = {

    action: function() {
        var functions = this.parent.scope.functions;
        var name = this.$name;
        if (functions[name]) {
            this.error('Повторное определение функции или ключа ' + this.$name);
        }

        this.$kid = this.state.kid++;
        this.$type = Yate.AST.functionType.KEY;

        functions[name] = this;
    },

    validate: function() {
        if (!Yate.Types.convertable(this.$nodes.type(), Yate.Types.NODESET)) {
            this.$nodes.error('Nodeset is required');
        }
        if (!Yate.Types.convertable(this.$use.type(), Yate.Types.SCALAR)) {
            this.$use.error('Scalar is required');
        }
    },

    _getType: function() {
        return this.$body.type();
    }

};

