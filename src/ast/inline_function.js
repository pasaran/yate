yate.AST.inline_function = {

    options: {
        base: 'inline_expr'
    },

    _getType: function() {
        return this.def.type();
    },

    action: function() {
        var def = this.def = this.scope.findFunction(this.Name);
        if (def) {
            if (def.Type == yate.AST.function_type.USER) {
                this.Fid = def.Fid;
            } else if (def.Type == yate.AST.function_type.KEY) {
                this.Kid = def.Kid;
            }
        }
    },

    prepare: function() {
        var def = this.def;
        var args = this.Args.Items;

        if (def.Type == yate.AST.function_type.KEY) {
            args[0].cast(yate.types.SCALAR);
        } else if (def.Type == yate.AST.function_type.INTERNAL) {
            var argTypes = def._argTypes;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0].cast(argTypes[i] || yate.types.SCALAR);
            }
        } else if (def.Type == yate.AST.function_type.USER) {
            var defArgs = def.Args.Items;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0].cast(defArgs[i].Typedef || yate.types.SCALAR);
            }
        }
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined function ' + this.Name);
        }
    }

};

