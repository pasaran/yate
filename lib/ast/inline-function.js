Yate.AST.inlineFunction = {

    options: {
        base: 'inlineExpr'
    },

    _getType: function() {
        return this.def.type();
    },

    action: function() {
        var def = this.def = this.scope.findFunction(this.Name);
        if (def) {
            if (def.Type == Yate.AST.functionType.USER) {
                this.Fid = def.Fid;
            } else if (def.Type == Yate.AST.functionType.KEY) {
                this.Kid = def.Kid;
            }
        }
    },

    prepare: function() {
        var def = this.def;
        var args = this.Args.Items;
        if (def.Type == Yate.AST.functionType.KEY) {
            args[0] = args[0].cast(Yate.Types.SCALAR);
        } else if (def.Type == Yate.AST.functionType.INTERNAL) {
            var argTypes = def._argTypes;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0] = args[0].cast(argTypes[i] || Yate.Types.SCALAR);
            }
        } else if (def.Type == Yate.AST.functionType.USER) {
            var defArgs = def.Args.Items;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0] = args[0].cast(defArgs[i].Typedef || Yate.Types.SCALAR);
            }
        }
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined function ' + this.Name);
        }
    }

};

