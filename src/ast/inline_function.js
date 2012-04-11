yate.AST.inline_function = {};

yate.AST.inline_function.options = {
    base: 'inline_expr'
};

yate.AST.inline_function._getType = function() {
    return this.def.type();
};

yate.AST.inline_function.action = function() {
    var def = this.def = this.scope.findFunction(this.Name);
    if (!this.def) {
        this.error('Undefined function ' + this.Name);
    }

    if (def.External) {
        this.External = true;
    } else if (def.Type == yate.AST.function_type.USER) {
        this.Fid = def.Fid;
    } else if (def.Type == yate.AST.function_type.KEY) {
        this.Kid = def.Kid;
    }
};

yate.AST.inline_function.prepare = function() {
    var def = this.def;
    var args = this.Args.Items;

    if (def.External) {
        // do nothing for now.
    } else if (def.Type == yate.AST.function_type.KEY) {
        args[0].cast('scalar');

    } else if (def.Type == yate.AST.function_type.INTERNAL) {
        var argTypes = def._argTypes;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( argTypes[i] || 'scalar' );
        }

    } else if (def.Type == yate.AST.function_type.USER) {
        var defArgs = def.Args.Items;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( defArgs[i].Typedef || 'scalar' );
        }

    }
};

yate.AST.inline_function.isLocal = function() {
    var name = this.Name;

    switch (name) {
        case 'name':
        case 'index': return true;

        case 'count':
        case 'true':
        case 'false': return false;

        case 'slice':
        case 'html':
            var args = this.Args.Items;
            for (var i = 0, l = args.length; i < l; i++) {
                if (args[i].isLocal()) { return true; }
            }
            return false;

    }

    return true; // FIXME: Для функций, в body которых нет локальных выражений, нужно возвращать false.
};

