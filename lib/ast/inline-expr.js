Yate.AST.inlineExpr = {

    options: {
        base: 'expr'
    },

    toResult: function(result) {
        if (this.mode) { // FIXME: А не нужно ли тут еще какого-нибудь условия?
            result.push( this.make('quote', this, this.mode) );
        } else {
            result.push(this);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineScalar = {

    options: {
        base: 'expr',
        mixin: 'items'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineOp = {

    options: {
        base: 'inlineExpr'
    },

    prepare: function() {
        var signature = this.signature;
        if (signature) {
            this.Left.cast(signature.left);
            if (this.Right) {
                this.Right.cast(signature.right);
            }
        }
    },

    _getType: function() {
        return this.signature.result;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineOr =
Yate.AST.inlineAnd = {

    signature: {
        left: Yate.Types.BOOLEAN,
        right: Yate.Types.BOOLEAN,
        result: Yate.Types.BOOLEAN
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineNot = {

    signature: {
        left: Yate.Types.BOOLEAN,
        result: Yate.Types.BOOLEAN
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineEq =
Yate.AST.inlineRel = {

    signature: {
        left: Yate.Types.SCALAR,
        right: Yate.Types.SCALAR,
        result: Yate.Types.BOOLEAN
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineAdd =
Yate.AST.inlineMul = {

    signature: {
        left: Yate.Types.SCALAR,
        right: Yate.Types.SCALAR,
        result: Yate.Types.SCALAR
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineUnion = {

    signature: {
        left: Yate.Types.NODESET,
        right: Yate.Types.NODESET,
        result: Yate.Types.NODESET
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineUnary = {

    signature: {
        left: Yate.Types.SCALAR,
        result: Yate.Types.SCALAR
    },

    options: {
        base: 'inlineOp'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineNumber = {

    options: {
        base: 'inlineExpr'
    },

    _type: Yate.Types.SCALAR

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineVar = {

    options: {
        base: 'inlineExpr'
    },

    action: function() {
        this.def = this.scope.findVar(this.Name);
        this.Vid = this.def.Vid;
    },

    _getType: function() {
        return this.def.type();
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined variable ' + this.Name);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.internalFunction = {

    _init: function(name, type, argTypes) {
        this.Name = name;
        this._type = type;
        this._argTypes = argTypes || [];
        this.Type = Yate.AST.functionType.INTERNAL;
    }

};

Yate.AST.internalFunctions = {
    'true': Yate.AST.make('internalFunction', 'true', Yate.Types.BOOLEAN),
    'false': Yate.AST.make('internalFunction', 'false', Yate.Types.BOOLEAN),
    'name': Yate.AST.make('internalFunction', 'name', Yate.Types.SCALAR),
    'position': Yate.AST.make('internalFunction', 'position', Yate.Types.SCALAR),
    'count': Yate.AST.make('internalFunction', 'count', Yate.Types.SCALAR),
    'slice': Yate.AST.make('internalFunction', 'slice', Yate.Types.SCALAR, [ Yate.Types.SCALAR, Yate.Types.SCALAR, Yate.Types.SCALAR ])
};

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

// ----------------------------------------------------------------------------------------------------------------- //

/*
Yate.AST.inlineList = {

    options: {
        base: 'expr',
        mixin: 'items'
    },

    _getType: function() {
        var items = this.Items;
        return (items.length == 1) ? items[0].type() : Yate.Types.SCALAR;
    },

    prepare: function() {
        if (this._asType === Yate.Types.XML) {
            this.trigger('set', 'mode', 'text');
        }
    }

};
*/

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.callArgs = {

    options: {
        mixin: 'items'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineComplex = {

    options: {
        base: 'inlineExpr'
    },

    _getType: function() {
        return this.Expr.type();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineString = {

    options: {
        base: 'inlineExpr'
    },

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.Value.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Value.toResult(result);
    }

};

Yate.AST.stringContent = {

    options: {
        mixin: 'items'
    },

    _type: Yate.Types.SCALAR

};

Yate.AST.stringExpr = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr) {
        this.Expr = expr;
    },

    _getType: function() {
        return this.Expr.type();
    }

};

Yate.AST.stringLiteral = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(s) {
        this.Value = s;
    },

    _type: Yate.Types.SCALAR,

    toResult: function(result) {
        if (this.mode === 'attr') {
            result.push(Yate.Common.quoteAttr(this.Value));
        } else if (this.mode === 'text') {
            result.push(Yate.Common.quoteText(this.Value));
        } else {
            result.push(this.Value);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.cast = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(from, to, expr) {
        this.From = from;
        this.To = to;
        this.Expr = expr;
        this.mode = expr.mode;
    },

    _getType: function() {
        return this.To;
    }

};

Yate.AST.quote = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr, mode) {
        this.Expr = expr;
        this.Mode = mode;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineGrep = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr, predicate) {
        this.Expr = expr;
        this.Predicate = predicate;
    },

    _type: Yate.Types.NODESET,

    validate: function() {
        if (!Yate.Types.convertable(this.Expr.type(), Yate.Types.NODESET)) {
            this.Expr.error('Type should be NODESET');
        }
    }

};

Yate.AST.inlineIndex = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr, index) {
        this.Expr = expr;
        this.Index = index;
    },

    _type: Yate.Types.NODESET,

    validate: function() {
        if (!Yate.Types.convertable(this.Expr.type(), Yate.Types.NODESET)) {
            this.Expr.error('Type should be NODESET');
        }
    },

    prepare: function() {
        this.Index = this.Index.cast(Yate.Types.SCALAR);
    }

};

