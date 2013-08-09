var asts = require('./asts.js');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //
//
//  inline expressions:
//
//    * inline_expr
//    * inline_op
//    * inline_or
//    * inline_and
//    * inline_eq
//    * inline_rel
//    * inline_add
//    * inline_mul
//    * inline_unary
//    * inline_not
//    * inline_union
//    * inline_number
//    * inline_string
//        * string_literal
//        * string_content
//        * string_expr
//    * inline_subexpr
//    * inline_var
//    * inline_function
//    * inline_internal_function
//    * quote
//    * cast
//    * sort
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_expr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_expr = {};

asts.inline_expr.options = {
    base: 'expr'
};

asts.inline_expr.toResult = function(result) {
    //  FIXME: А не нужно ли тут еще какого-нибудь условия?
    if (this.mode) {
        result.push( this.make('quote', {
            Expr: this,
            Mode: this.mode
        }) );
    } else {
        result.push(this);
    }
};

asts.inline_expr.inline = no.true;

asts.inline_expr.closes = function() {
    return ( this.getType() != 'attr' ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

var _needCast = {
    'nodeset-scalar': true,
    'nodeset-xml': true,
    'nodeset-attrvalue': true,
    'nodeset-boolean': true,
    'nodeset-data': true,

    'scalar-xml': true,
    'scalar-attrvalue': true,

    'xml-attrvalue': true,
    'xml-scalar': true,

    'object-nodeset': true,
    'array-nodeset': true
};

asts.inline_expr.w_transform = function() {
    var AsType = this.AsType;

    if ( this.isSimple() && (!AsType || AsType === 'scalar' || AsType === 'boolean') ) {
        return this;
    }

    if ( AsType && needCast( this.getType(), AsType ) ) {
        return this.make( 'cast', { to: AsType, expr: this } );
    }

    return this;

    function needCast(from, to) {
        return _needCast[from + '-' + to];
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_op
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_op = {};

asts.inline_op.options = {
    base: 'inline_expr',
    props: 'Left Op Right'
};

asts.inline_op.w_setTypes = function() {
    var signature = this.signature;
    if (signature) {
        this.Left.cast(signature.left);
        if (this.Right) {
            this.Right.cast(signature.right);
        }
    }
};

asts.inline_op.isLocal = function() {
    return this.Left.isLocal() || ( this.Right && this.Right.isLocal() );
};

asts.inline_op._getType = function() {
    return this.signature.result;
};

asts.inline_op.getScope = function() {
    var lscope = this.Left.getScope();
    if (this.Right) {
        var rscope = this.Right.getScope();
        return yate.Scope.commonScope(lscope, rscope);
    } else {
        return lscope;
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_or
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_or = {};

asts.inline_or.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

asts.inline_or.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_and
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_and = {};

asts.inline_and.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

asts.inline_and.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_eq
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_eq = {};

asts.inline_eq.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

asts.inline_eq.options = {
    base: 'inline_op'
};

asts.inline_eq.w_setTypes = function() {
    var Left = this.Left;
    var Right = this.Right;

    var lType = Left.getType();
    var rType = Right.getType();

    if (lType === 'boolean' || rType === 'boolean') {
        Left.cast('boolean');
        Right.cast('boolean');
    } else if (lType !== 'nodeset' && rType !== 'nodeset') {
        Left.cast('scalar');
        Right.cast('scalar');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_rel
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_rel = {};

asts.inline_rel.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

asts.inline_rel.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_add
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_add = {};

asts.inline_add.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

asts.inline_add.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_mul
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_mul = {};

asts.inline_mul.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

asts.inline_mul.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_unary
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_unary = {};

asts.inline_unary.signature = {
    left: 'scalar',
    result: 'scalar'
};

asts.inline_unary.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_not
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_not = {};

asts.inline_not.signature = {
    left: 'boolean',
    result: 'boolean'
};

asts.inline_not.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_union
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_union = {};

asts.inline_union.signature = {
    left: 'nodeset',
    right: 'nodeset',
    result: 'nodeset'
};

asts.inline_union.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_number
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_number = {};

asts.inline_number.options = {
    base: 'inline_expr',
    props: 'Value'
};

asts.inline_number.isLocal = no.false;

asts.inline_number.isConst = no.true;

asts.inline_number._getType = no.value('scalar');


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_string = {};

asts.inline_string.options = {
    base: 'inline_expr',
    props: 'Value'
};

asts.inline_string._getType = no.value('scalar');

asts.inline_string.oncast = function(to) {
    this.Value.cast(to);

    //  FIXME: WTF?
    return false;
};

asts.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

asts.inline_string.asString = function() {
    var s = '';

    this.Value.iterate(function(item) {
        s += item.asString();
    });

    return s;
};

asts.inline_string.isConst = function() {
    return this.Value.isConst();
};

asts.inline_string.isLocal = function() {
    return this.Value.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_content
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_content = {};

asts.string_content.options = {
    mixin: 'items'
};

asts.string_content._getType = no.value('scalar');

asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_expr = {};

asts.string_expr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

asts.string_expr._init = function(ast) {
    this.Expr = ast.Expr;
};

asts.string_expr._getType = function() {
    return this.Expr.getType();
};

asts.string_expr.isLocal = function() {
    return this.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_literal
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_literal = {};

asts.string_literal.options = {
    props: 'Value'
};

asts.string_literal.w_action = function() {
    this.Value = deentitify(this.Value);
};

asts.string_literal.options = {
    base: 'inline_expr'
};

asts.string_literal._init = function(ast) {
    this.Value = ast.Value;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
asts.string_literal.yate = function() {
    return this.Value;
};

asts.string_literal._getType = no.value('scalar');

asts.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.Value = yr.text2attr(this.Value);
    } else if (to === 'xml') {
        this.Value = yr.text2xml(this.Value);
    }

    return false;
};

asts.string_literal.stringify = function() {
    return JSON.stringify(this.Value);
};

asts.string_literal.asString = function() {
    return this.Value;
};

asts.string_literal.isConst = no.true;

asts.string_literal.isLocal = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_subexpr = {};

asts.inline_subexpr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

asts.inline_subexpr.isLocal = function() {
    return this.Expr.isLocal();
};

asts.inline_subexpr._getType = function() {
    return this.Expr.getType();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_var
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_var = {};

asts.inline_var.options = {
    base: 'inline_expr',
    props: 'Name'
};

asts.inline_var.w_action = function() {
    var def = this.def = this.scope.findVar(this.Name);
    if (!def) {
        this.error('Undefined variable ' + this.Name);
    }

    this.Id = def.p.Id;
};

asts.inline_var._getType = function() {
    return this.def.getType();
};

asts.inline_var.isLocal = no.false;

asts.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.Name).scope;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_function
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_function = {};

asts.inline_function.options = {
    base: 'inline_expr',
    props: 'Name Args'
};

asts.inline_function._getType = function() {
    var def = this.def;
    if (def.f.IsInternal) {
        return this.signature.type;
    }

    return def.getType();
};

asts.inline_function.w_action = function() {
    var name = this.Name;

    //  Ищем функцию в scope'ах.
    var def = this.scope.findFunction(name);

    if (!def) {
        //  Ищем среди внутренних функций.
        def = internalFunctions[name];

        //  Среди уже инстанцированных нет, смотрим, есть ли определение для внутренней функции.
        var params;
        if ( !def && (( params = yate.consts.internalFunctions[name] )) ) {
            //  Если есть, создаем ее.
            params = {
                signatures: (params instanceof Array) ? params : [ params ],
                name: name
            };
            def = internalFunctions[name] = this.make('inline_internal_function', params);
        }
    }

    if (!def) {
        this.error('Undefined function ' + name);
    }

    this.def = def;

    if (def.f.IsExternal) {
        this.f.IsExternal = true;
    } else if (def.f.IsUser) {
        this.Id = def.p.Id;
        this.f.IsUser = true;
    } else if (def.f.IsKey) {
        this.Id = def.p.Id;
        this.f.IsKey = true;
    } else {
        this.signature = def.findSignature(this.Args.p.Items);
        if (!this.signature) {
            this.error('Cannot find signature for this arguments');
        }
    }
};

asts.inline_function.w_prepare = function() {
    var def = this.def;
    var args = this.Args;

    if (def.f.IsExternal) {
        var argTypes = def.p.ArgTypes;
        args.iterate(function(arg, i) {
            arg.cast( argTypes[i] || 'scalar' );
        });

    } else if (def.f.IsKey) {
        var type = args.first().getType();
        if (type !== 'nodeset') {
            args.first().cast('scalar');
        }

    } else if (def.f.IsInternal) {
        var signature = this.signature;
        var types = signature.args;
        var defType = signature.defType;
        args.iterate(function(arg, i) {
            arg.cast( types[i] || defType );
        });

    } else if (def.f.IsUser) {
        var defArgs = def.p.Args.p.Items;
        args.iterate(function(arg, i) {
            arg.cast( defArgs[i].p.Typedef || 'scalar' );
        });

    }
};

asts.inline_function.getScope = function() {
    //  Если в предикате используется вызов функции,
    //  то определение этого jpath'а нужно выводить в этом же scope.
    //  См. ../tests/functions.18.yate
    return this.scope;
};

asts.inline_function.isLocal = function() {
    if (this.def.f.IsInternal) {
        if (this.signature.local) {
            return true;
        }

        return this.Args.someIs('isLocal');
        /*
        var args = this.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].isLocal() ) { return true; }
        }
        return false;
        */
    }

    if (this.f.IsExternal || this.f.IsKey) {
        return this.Args.someIs('isLocal');
        /*
        var args = this.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].isLocal() ) { return true; }
        }
        return false;
        */
    }

    return this.def.isLocal();
};

asts.inline_function.js__internal = function() {
    var signature = this.signature;
    this.Signature = signature.args.join(',');
    return yate.AST.js.generate('internal_function_' + this.Name, this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_internal_function
//  ---------------------------------------------------------------------------------------------------------------  //

//  Сюда будем складывать инстансы inline_internal_function.
//  Определения для них лежат в consts.js, а создаются они в inline_function.action.
var internalFunctions = {};

asts.inline_internal_function = {};

asts.inline_internal_function.options = {
    props: 'Name'
};

asts.inline_internal_function._init = function(params) {
    this.Name = params.name;
    var signatures = this.signatures = params.signatures;
    for (var i = 0, l = signatures.length; i < l; i++) {
        prepareSignature( signatures[i] );
    }
    this.f.IsInternal = true;

    function prepareSignature(signature) {
        var args = signature.args = signature.args || [];
        for (var i = 0, l = args.length; i < l; i++) {
            var arg = args[i];
            if ( arg.substr(0, 3) === '...' ) {
                args[i] = arg.substr(3);

                signature.defType = args[i];
            }
        }
    }
};

asts.inline_internal_function.findSignature = function(callargs) {
    var signatures = this.signatures;

    for (var i = 0, l = signatures.length; i < l; i++) {
        var signature = signatures[i];
        //  Смотрим, подходят ли переданные аргументы под одну из сигнатур.
        if ( checkArgs(signature, callargs) ) {
            return signature;
        }
    }

    function checkArgs(signature, callargs) {
        var args = signature.args;
        var defType = signature.defType;

        for (var i = 0, l = callargs.length; i < l; i++) {
            var callarg = callargs[i];
            var arg = args[i] || defType;

            //  Для каждого переданного аргумента должен быть
            //      а) формальный аргумент
            //      б) тип переданного аргумента должен приводиться к типу формального.
            if ( !arg || !yate.types.convertable( callarg.getType(), arg ) ) {
                return false;
            }
        }

        return true;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  quote
//  ---------------------------------------------------------------------------------------------------------------  //

asts.quote = {};

asts.quote.options = {
    base: 'inline_expr',
    props: 'Expr Mode'
};

asts.quote._init = function(params) {
    this.Expr = params.expr;
    this.Mode = params.mode;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  cast
//  ---------------------------------------------------------------------------------------------------------------  //

asts.cast = {};

asts.cast.options = {
    base: 'inline_expr',
    props: 'From To Expr'
};

asts.cast._init = function(params) {
    var to = params.to;
    var expr = params.expr;

    this.From = expr.getType();
    this.To = to;
    this.Expr = expr;
    this.mode = expr.mode;
};

asts.cast._getType = function() {
    return this.To;
};

asts.cast.isLocal = function() {
    return this.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  sort
//  ---------------------------------------------------------------------------------------------------------------  //

asts.sort = {};

asts.sort.options = {
    base: 'inline_expr',
    props: 'Nodes Order By'
};

asts.sort._getType = no.value('nodeset');

asts.sort.w_validate = function() {
    if (this.Nodes.getType() !== 'nodeset') {
        this.Nodes.error('Type should be nodeset.');
    }
};

asts.sort.w_prepare = function() {
    this.By.cast('scalar');
};

