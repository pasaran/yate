Yate.AST.inlineExpr = {

    options: {
        base: 'expr'
    },

    oncast: function(from, to) {
        if (from !== to) {
            return this.make('cast', from, to, this);
        }
    },

    toResult: function(result) {
        if (this.mode && this.type() !== Yate.Types.XML) { // FIXME: Костыль.
            result.push( this.make('quote', this, this.mode) );
        } else {
            result.push(this);
        }
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
            this.$left = this.$left.cast(signature.left);
            if (this.$right) {
                this.$right = this.$right.cast(signature.right);
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
        this.def = this.scope.findVar(this.$name);
        this.$vid = this.def.$vid;
    },

    _getType: function() {
        return this.def.type();
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined variable ' + this.$name);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.internalFunction = {

    _init: function(name, type, argTypes) {
        this.$name = name;
        this._type = type;
        this._argTypes = argTypes || [];
        this.$type = Yate.AST.functionType.INTERNAL;
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
        var def = this.def = this.scope.findFunction(this.$name);
        if (def) {
            if (def.$type == Yate.AST.functionType.USER) {
                this.$fid = def.$fid;
            } else if (def.$type == Yate.AST.functionType.KEY) {
                this.$kid = def.$kid;
            }
        }
    },

    prepare: function() {
        var def = this.def;
        var args = this.$args.$items;
        if (def.$type == Yate.AST.functionType.KEY) {
            args[0] = args[0].cast(Yate.Types.SCALAR);
        } else if (def.$type == Yate.AST.functionType.INTERNAL) {
            var argTypes = def._argTypes;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0] = args[0].cast(argTypes[i] || Yate.Types.SCALAR);
            }
        } else if (def.$type == Yate.AST.functionType.USER) {
            var defArgs = def.$args.$items;
            for (var i = 0, l = args.length; i < l; i++) {
                args[0] = args[0].cast(defArgs[i].$typedef || Yate.Types.SCALAR);
            }
        }
    },

    validate: function() {
        if (!this.def) {
            this.error('Undefined function ' + this.$name);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineList = {

    options: {
        base: 'expr',
        mixin: 'items'
    },

    _getType: function() {
        var items = this.$items;
        return (items.length == 1) ? items[0].type() : Yate.Types.SCALAR;
    },

    prepare: function() {
        if (this._asType === Yate.Types.XML) {
            this.trigger('set', 'mode', 'text');
        }
    },

    oncast: function(from, to) {
        var items = this.$items;
        for (var i = 0, l = items.length; i < l; i++) {
            items[i] = items[i].cast(to);
        }
    }

};

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
        return this.$expr.type();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineString = {

    options: {
        base: 'inlineExpr'
    },

    _type: Yate.Types.SCALAR,

    prepare: function() {
        this.$value.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.$value.toResult(result);
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
        this.$expr = expr;
    },

    _getType: function() {
        return this.$expr.type();
    }

};

Yate.AST.stringLiteral = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(s) {
        this.$value = s;
    },

    _type: Yate.Types.SCALAR,

    toResult: function(result) {
        if (this.mode === 'attr') {
            result.push(Yate.Common.quoteAttr(this.$value));
        } else if (this.mode === 'text') {
            result.push(Yate.Common.quoteText(this.$value));
        } else {
            result.push(this.$value);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.cast = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(from, to, expr) {
        this.$from = from;
        this.$to = to;
        this.$expr = expr;
        this.mode = expr.mode;
    },

    _getType: function() {
        return this.$to;
    }

};

Yate.AST.quote = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr, mode) {
        this.$expr = expr;
        this.$mode = mode;
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.inlineGrep = {

    options: {
        base: 'inlineExpr'
    },

    _init: function(expr, predicate) {
        this.$expr = expr;
        this.$predicate = predicate;
    },

    _type: Yate.Types.NODESET,

    validate: function() {
        if (!Yate.Types.convertable(this.$expr.type(), Yate.Types.NODESET)) {
            this.$expr.error('Type should be NODESET');
        }
    }

};

