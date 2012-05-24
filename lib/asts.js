var common = require('parse-tools/common.js');

var types = require('./types.js');
var Scope = require('./scope.js');
var consts = require('./consts.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.apply = {};

asts.apply.options = {
    base: 'expr'
};

asts.apply._type = 'xml';

asts.apply.validate = function() {
    if ( !this.Expr.type('nodeset') ) {
        this.error('Type of expression should be NODESET');
    }
};

asts.apply.closes = common.false;

//  ---------------------------------------------------------------------------------------------------------------  //

asts.arglist_item = {};

asts.arglist_item.action = function() {
    //  FIXME: Очень уж хрупкая конструкция.
    //  NOTE: Смысл в том, что в AST параметры и блок на одном уровне, а отдельный scope создается
    //  только для блока. И аргументы нужно прописывать именно туда.
    var vars = this.parent.parent.Body.Block.scope.vars;

    var name = this.Name;
    if ( vars[name] ) {
        this.error('Повторное определение аргумента ' + this.Name);
    }

    this.Vid = this.state.vid++;
    this.Type = 'argument';

    vars[name] = this;
};

asts.arglist_item._getType = function() {
    if (this.Typedef == 'nodeset') { return 'nodeset'; }
    if (this.Typedef == 'boolean') { return 'boolean'; }
    return 'scalar';
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.arglist = {};

asts.arglist.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

/*
asts.array = {};

asts.array._type = 'array';

asts.array.action = function() {
    this.Block.AsList = true;
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

asts.attr = {};

asts.attr.options = {
    base: 'xml'
};

asts.attr._type = 'attr';

asts.attr.setTypes = function() {
    this.Value.cast('scalar');
};

asts.attr.prepare = function() {
    if (!this.Value.inline()) {
        this.Value.rid();
    }
};

asts.attr.closes = common.false;

// ----------------------------------------------------------------------------------------------------------------- //

//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_close = {};

asts.attrs_close._type = 'xml';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_open = {};

asts.attrs_open._init = function(item) {
    this.Name = item.Name;
    this.Attrs = item.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.make('attrs_open', ...),
    //  но setTypes для xml_attr случает раньше этого.
    this.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    item.Attrs = null;
};

asts.attrs_open._type = 'xml';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_defs = {};

asts.block_defs.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_exprs = {};

asts.block_exprs.options = {
    mixin: 'items'
};

asts.block_exprs.validate = function() {
    var opened = [];
    this.iterate(function(item) {
        if (item.is('xml_line') || item.is('block_list')) {
            item.wellFormed(opened);
        }
    });
    if (opened.length > 0) {
        this.error('Невалидный XML в блоке. Ожидается </' + opened[0] + '>');
    }
};

asts.block_exprs.prepare = function() {
    if ( this.type() !== 'xml' && this.AsType !== 'xml' ) { return; }

    var items = this.Items;
    var l = items.length;
    if (!l) { return; }

    var prevOpened = this.parent.prevOpened; // block.prevOpened.

    var o = [];
    for (var i = 0; i < l; i++) {
        var item = items[i];
        var next = items[i + 1];

        if ( item.closes() && (prevOpened !== false) ) {
            o.push( this.make('attrs_close', this) );

            prevOpened = false;
        }

        o.push(item);

        if ( item.opens() && !(next && next.closes()) ) {
            var lastTag = item.lastTag();

            lastTag.open = true;
            o.push( this.make('attrs_open', lastTag) );

            prevOpened = true;
        }

        item.setPrevOpened(prevOpened);
    }

    this.Items = o;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block = {};

asts.block.options = {
    scope: true,
    order: [ 'Defs', 'Templates', 'Exprs' ] //// , 'AsList' ]
};

asts.block._init = function(exprs) {
    this.Defs = this.factory.make('block_defs');
    this.Templates = this.factory.make('block_templates');
    this.Exprs = this.factory.make('block_exprs', exprs);
};

asts.block._getType = function() {
    return this.Exprs.type();
};

asts.block.action = function() {
    /// this.Exprs.AsList = this.AsList;

    if ( this.Defs.empty() && this.Templates.empty() && this.Exprs.inline() ) {
        this.Inline = true;
    }
};

asts.block.oncast = function(to) {
    this.Exprs.cast(to);
};

asts.block.closes = function() {
    //  FIXME: Может таки унести это в block_exprs.closes?
    var exprs = this.Exprs.Items;
    if (!exprs.length) { return false; }

    return exprs[0].closes();
};

asts.block.setPrevOpened = function(prevOpened) {
    this.prevOpened = prevOpened;
};

asts.block.mergeWith = function(block) {
    this.Templates.mergeWith(block.Templates);
    this.Defs.mergeWith(block.Defs);
    this.Exprs.mergeWith(block.Exprs);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_templates = {};

asts.block_templates.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.body = {};

asts.body._getType = function() {
    return this.Block.type();
};

asts.body.closes = function() {
    return this.Block.closes();
};

asts.body.oncast = function(to) {
    this.Block.cast(to);
};

asts.body.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.callargs = {};

asts.callargs.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.cast = {};

asts.cast.options = {
    base: 'inline_expr'
};

asts.cast._init = function(params) {
    var to = params.to;
    var expr = params.expr;

    this.From = expr.type();
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

asts.external = {};

asts.external.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.External = true;

    functions[name] = this;
};

asts.external._getType = function() {
    return this.Type;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.for_ = {};

asts.for_.options = {
    base: 'expr'
};

asts.for_._getType = function() {
    var type = this.Body.type();

    return types.joinType(type, type);
};

asts.for_.oncast = function(to) {
    this.Body.cast(to);
};

asts.for_.prepare = function() {
    this.Body.cid();
};

asts.for_.closes = function() {
    return this.Body.closes();
};

asts.for_.setPrevOpened = function(prevOpened) {
    this.Body.setPrevOpened(prevOpened);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.function_ = {};

asts.function_.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.Fid = this.state.fid++;
    this.Type = 'user';

    functions[name] = this;
};

asts.function_.validate = function() {
    if (this.Body.type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

asts.function_._getType = function() {
    return this.Body.type();
};

asts.function_.setTypes = function() {
    this.Body.cast();
};

asts.function_.extractDefs = function() {
    this.scope.defs.push(this);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.if_ = {};

asts.if_.options = {
    base: 'expr'
};

asts.if_._getType = function() {
    var thenType = this.Then.type();
    var elseType = (this.Else) ? this.Else.type() : 'undef';

    return types.commonType(thenType, elseType);
};

asts.if_.setTypes = function() {
    this.Condition.cast('boolean');
};

asts.if_.oncast = function(to) {
    this.Then.cast(to);
    if (this.Else) {
        this.Else.cast(to);
    }
};

asts.if_.closes = function() {
    if (!this.Else) {
        return this.Then.closes();
    }
    return this.Then.closes() && this.Else.closes();
};

asts.if_.setPrevOpened = function(prevOpened) {
    this.Then.setPrevOpened(prevOpened);
    if (this.Else) {
        this.Else.setPrevOpened(prevOpened);
    }
};

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

asts.inline_compound = {};

asts.inline_compound.options = {
    base: 'inline_expr'
};

asts.inline_compound.isLocal = function() {
    return this.Expr.isLocal();
};

asts.inline_compound._getType = function() {
    return this.Expr.type();
};

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

//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_expr = {};

asts.inline_expr.options = {
    base: 'expr'
};

asts.inline_expr.toResult = function(result) {
    //  FIXME: А не нужно ли тут еще какого-нибудь условия?
    if (this.mode) {
        result.push( this.make('quote', {
            expr: this,
            mode: this.mode
        }) );
    } else {
        result.push(this);
    }
};

asts.inline_expr.inline = common.true;

asts.inline_expr.closes = function() {
    return ( this.type() != 'attr' ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

asts.inline_expr.transform = function() {
    if (this.AsType) {
        return this.factory.make( 'cast', { to: this.AsType, expr: this } );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_function = {};

asts.inline_function.options = {
    base: 'inline_expr'
};

asts.inline_function._getType = function() {
    return this.def.type();
};

asts.inline_function.action = function() {
    var name = this.Name;

    //  Ищем функцию в scope'ах.
    var def = this.scope.findFunction(name);

    if (!def) {
        //  Ищем среди внутренних функций.
        def = internalFunctions[name];

        //  Среди уже инстанцированных нет, смотрим, есть ли определение для внутренней функции.
        var params;
        if ( !def && (( params = consts.internalFunctions[name] )) ) {
            //  Если есть, создаем ее.
            def = internalFunctions[name] = this.factory.make('inline_internal_function', params);
        }
    }

    if (!def) {
        this.error('Undefined function ' + name);
    }

    this.def = def;

    if (def.External) {
        this.External = true;
    } else if (def.Type == 'user') {
        this.Fid = def.Fid;
    } else if (def.Type == 'key') {
        this.Kid = def.Kid;
    }
};

asts.inline_function.prepare = function() {
    var def = this.def;
    var args = this.Args.Items;

    if (def.External) {
        var argTypes = def.ArgTypes;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( argTypes[i] || 'scalar' );
        }

    } else if (def.Type == 'key') {
        args[0].cast('scalar');

    } else if (def.Type == 'internal') {
        var argTypes = def._argTypes;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( argTypes[i] || 'scalar' );
        }

    } else if (def.Type == 'user') {
        var defArgs = def.Args.Items;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( defArgs[i].Typedef || 'scalar' );
        }

    }
};

asts.inline_function.isLocal = function() {
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

    //  FIXME: Для функций, в body которых нет локальных выражений, нужно возвращать false.
    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_internal_function = {};

asts.inline_internal_function._init = function(params) {
    this.Name = params.name;
    this._type = params.type;
    this._argTypes = params.argTypes || [];
    this.Type = 'internal';
};

//  Сюда будем складывать инстансы inline_internal_function.
//  Определения для них лежат в yate-consts.js, а создаются они в inline_function.action.
var internalFunctions = {};

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

asts.inline_not = {};

asts.inline_not.signature = {
    left: 'boolean',
    result: 'boolean'
};

asts.inline_not.options = {
    base: 'inline_op'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_number = {};

asts.inline_number.options = {
    base: 'inline_expr'
};

asts.inline_number.isLocal = common.false;

asts.inline_number._type = 'scalar';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_op = {};

asts.inline_op.options = {
    base: 'inline_expr'
};

asts.inline_op.setTypes = function() {
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
        return Scope.commonScope( lscope, rscope );
    } else {
        return lscope;
    }
};

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

asts.inline_string = {};

asts.inline_string.options = {
    base: 'inline_expr'
};

asts.inline_string._type = 'scalar';

asts.inline_string.oncast = function(to) {
    this.Value.cast(to);

    return false;
};

asts.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

asts.inline_string.asString = function() {
    var s = '';

    var items = this.Value.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        s += item.asString();
    }

    return s;
};

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

asts.inline_var = {};

asts.inline_var.options = {
    base: 'inline_expr'
};

asts.inline_var.action = function() {
    this.def = this.scope.findVar(this.Name);
    if (!this.def) {
        this.error('Undefined variable ' + this.Name);
    }
};

asts.inline_var._getType = function() {
    return this.def.type();
};

asts.inline_var.isLocal = common.false;

asts.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.Name).scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  asts.items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._init = function(items) {
    this.Items = common.makeArray(items || []);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.add = function(item) {
    this.Items.push(item);
};

asts.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

asts.items.empty = function() {
    return (this.Items.length == 0);
};

asts.items.iterate = function(callback) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], i);
    }
};

asts.items.grep = function(callback) {
    var items = this.Items;
    var r = [];
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (callback(item, i)) {
            r.push(item);
        }
    }
    return r;
};

asts.items.map = function(callback) {
    return this.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.code = function(lang, mode) {
    mode = mode || '';

    var result = this._code(lang, mode);
    if (result !== undefined) {
        return result;
    }

    var r = [];

    this.iterate(function(item) {
        r.push( item.code(lang, mode) );
    });

    // Пробуем this.jssep$mode(), затем this.codesep$mode().
    var suffix = 'sep$' + (mode || '');
    var sep = this[lang + suffix] || this['code' + suffix] || '';

    return r.join(sep);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
asts.items.someIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if (callback( items[i] )) { return true; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return true; }
        }
    }

    return false;
};

asts.items.allIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !items[i][callback]() ) { return false; }
        }
    }

    return true;
};

asts.items.noneIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return false; }
        }
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.applyChildren = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback( items[i], params );
    }
};

asts.items.walkAfter = function(callback, params, pKey, pObject) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkAfter(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

asts.items.walkBefore = function(callback, params) {
    callback(this, params);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkBefore(callback, params, i, items);
    }
};

asts.items.mergeWith = function(ast) {
    this.Items = this.Items.concat(ast.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  asts.items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._getType = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var currentId = items[0].id;
    var currentType = items[0].type();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var nextType = item.type();

        var commonType = types.joinType(currentType, nextType);
        if (commonType == 'none') {
            item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
        }
        currentId = item.id;
        currentType = commonType;
    };

    return currentType;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.isLocal = function() {
    return this.someIs('isLocal');
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.getScope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_dots = {};

asts.jpath_dots.action = function() {
    this.Length = this.Dots.length - 1;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_filter = {};

asts.jpath_filter.options = {
    base: 'inline_expr'
};

asts.jpath_filter._init = function(params) {
    this.Expr = params.expr;
    this.JPath = params.jpath;
};

asts.jpath_filter._type = 'nodeset',

asts.jpath_filter.isLocal = function() {
    return this.Expr.isLocal() || this.JPath.isLocal();
};

asts.jpath_filter.getScope = function() {
    return Scope.commonScope( this.Expr.getScope(), this.JPath.getScope() );
};

asts.jpath_filter.validate = function() {
    if (!this.Expr.type( 'nodeset' )) {
        this.Expr.error('Type should be NODESET');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath = {};

asts.jpath.options = {
    base: 'inline_expr'
};

asts.jpath._type = 'nodeset';

asts.jpath.isLocal = common.true;

asts.jpath.validate = function() {
    var context = this.Context;
    if (context && !context.type( 'nodeset' )) {
        context.error('Invalid type. Should be NODESET');
    }
};

// oncast = function() {},

// Возвращаем значение последнего nametest'а или же ''.
// Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
asts.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.Steps.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if (step.is('jpath_nametest')) {
            return step.Name;
        }
    }
    return '';
};

asts.jpath.getScope = function() {
    return this.Steps.getScope();
};

asts.jpath.extractDefs = function() {
    var key = this.yate(); // Каноническая запись jpath.

    var state = this.state;
    var scope = this.getScope(); // scope, в котором этот jpath имеет смысл.
                                 // Например, .foo.bar[ .count > a + b ] имеет смысл только внутри scope'а,
                                 // в котором определены переменные a и b.

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var jid = scope.jkeys[key];
    if (jid === undefined) {
        jid = scope.jkeys[key] = state.jid++;
        scope.defs.push(this);
    }

    this.Jid = jid; // Запоминаем id-шник.
    this.Key = key;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_predicate = {};

asts.jpath_predicate.getScope = function() {
    return this.Expr.getScope();
};

asts.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

asts.jpath_predicate.setTypes = function() {
    if (this.isLocal()) { // .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast( 'boolean' );
    } else { // .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast( 'scalar' );
    }
};

asts.jpath_predicate.extractDefs = function() {
    var key = this.Expr.yate(); // Каноническая запись предиката.

    var state = this.state;
    var scope = this.getScope(); // См. примечание в jpath.action() (jpath.js).

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    this.Pid = pid;
    this.Key = key;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_step = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_steps = {};

asts.jpath_steps.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.key = {};

asts.key.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.Kid = this.state.kid++;
    this.Type = 'key';

    functions[name] = this;
};

asts.key.validate = function() {
    if (!this.Nodes.type( 'nodeset' )) {
        this.Nodes.error('Nodeset is required');
    }
    if (!this.Use.type( 'scalar' )) {
        this.Use.error('Scalar is required');
    }
};

asts.key._getType = function() {
    return this.Body.type();
};

asts.key.prepare = function() {
    this.Body.cast();
};

asts.key.extractDefs = function() {
    this.scope.defs.push(this);
};

//  ---------------------------------------------------------------------------------------------------------------  //

/*
asts.object = {};

asts.object._type = 'object',

asts.object.action = function() {
    this.Block.AsList = true;
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

asts.pair = {};

asts.pair._type = 'pair',

asts.pair.setTypes = function() {
    this.Key.cast('scalar');

    var type = this.Value.type();
    if (type == 'array' || type == 'object') {
        this.Value.cast(type);
    } else {
        this.Value.cast('xml'); // FIXME: А не scalar?
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.quote = {};

asts.quote.options = {
    base: 'inline_expr'
};

asts.quote._init = function(params) {
    this.Expr = params.expr;
    this.Mode = params.mode;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.root = {};

asts.root._type = 'nodeset';

asts.root.isLocal = common.false;

//  ---------------------------------------------------------------------------------------------------------------  //

asts.compound = {};

asts.compound._getType = function() {
    return this.Block.type();
};

asts.compound.oncast = function(to) {
    this.Block.cast(to);
};

asts.compound.closes = function() {
    return this.Block.closes();
};

asts.compound.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.value = {};

asts.value._getType = function() {
    return this.Value.type();
};

asts.value.oncast = function(to) {
    this.Value.cast(to);
};

asts.value.inline = function() {
    return this.Value.inline();
};

asts.value.closes = function() {
    return this.Value.closes();
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_content = {};

asts.string_content.options = {
    mixin: 'items'
};

asts.string_content._type = 'scalar';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_expr = {};

asts.string_expr.options = {
    base: 'inline_expr'
};

asts.string_expr._init = function(expr) {
    this.Expr = expr;
};

asts.string_expr._getType = function() {
    return this.Expr.type();
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_literal = {};

asts.string_literal.options = {
    base: 'inline_expr'
};

asts.string_literal._init = function(s) {
    this.Value = s;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
asts.string_literal.yate = function() {
    return this.Value;
};

asts.string_literal._type = 'scalar';

asts.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.Value = common.quoteAttr(this.Value);
    } else if (to === 'xml') {
        this.Value = common.quoteText(this.Value);
    }

    return false;
};

asts.string_literal.stringify = function() {
    return JSON.stringify( this.Value );
};

asts.string_literal.asString = function() {
    return this.Value;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.stylesheet = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.template = {};

asts.template.action = function() {
    this.Tid = this.state.tid++;
};

asts.template.setTypes = function() {
    this.Body.cast( this.type() );
};

asts.template._getType = function() {
    var type = this.Body.type();
    if (type == 'array' || type == 'object') {
        return type;
    }
    return 'xml';
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.template_mode = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.var_ = {};

asts.var_.action = function() {
    var vars = this.scope.vars;
    var name = this.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    this.Vid = this.state.vid++;
    this.Type = 'user';

    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.Lazy = true;
    }

    vars[name] = this;
};

asts.var_._getType = function() {
    return this.Value.type();
};

asts.var_.setTypes = function() {
    this.Value.cast();
};

asts.var_.prepare = function() {
    this.Value.rid();
};

asts.var_.extractDefs = function() {
    this.scope.defs.push(this);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attr = {};

asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.Name + '="');
    this.Value.toResult(result);
    result.push('"');
};

asts.xml_attr.prepare = function() {
    if ( !this.parent.parent.is('attrs_open') ) { // FIXME: Как бы не ходить по дереву так уродливо?
        this.Value.cast('attrvalue');
    } else {
        this.Value.cast('scalar');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attrs = {};

asts.xml_attrs.options = {
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_empty = {};

asts.xml_empty.options = {
    base: 'xml'
};

asts.xml_empty.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    this.Attrs.toResult(result);
    if ( consts.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_end = {};

asts.xml_end.options = {
    base: 'xml'
};

asts.xml_end.action = function() {
    if (consts.shortTags[ this.Name ]) {
        this.Short = true;
    }
};

asts.xml_end.toResult = function(result) {
    if (!this.Short) {
        result.push('</' + this.Name + '>');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_full = {};

asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml = {};

asts.xml.options = {
    base: 'expr'
};

asts.xml._type = 'xml';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_line = {};

asts.xml_line.options = {
    base: 'xml',
    mixin: 'items'
};

asts.xml_line.wellFormed = function(opened) {
    var that = this;

    this.iterate(function(item) {
        if (item.is('xml_start')) {
            opened.push(item.Name);
        } else if (item.is('xml_end')) {
            var name = opened.pop();
            if (!name) {
                that.error('Закрывающий тег </' + item.Name + '> не был предварительно открыт');
            } else if ( (item.Name !== name) && (item.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            item.Name = name; // FIXME: Не очень подходящее место для этого действия.
                              //        Лучше бы унести это в какой-то .action().
        }
    });
};

asts.xml_line.opens = function() {
    return !!this.lastTag();
};

asts.xml_line.lastTag = function() {
    var last = this.last();
    if (last.is('xml_start')) {
        return last;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_start = {};

asts.xml_start.options = {
    base: 'xml'
};

asts.xml_start.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push( (consts.shortTags[name]) ? '/>' : '>' );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_text = {};

asts.xml_text.options = {
    base: 'xml'
};

asts.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

asts.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};

//  ---------------------------------------------------------------------------------------------------------------  //

// FIXME: Если сделать scope.defs не массивом, а AST.items, то этот метод можно убрать совсем.
asts.block.js__defs = function() {
    var defs = this.scope.defs;
    var r = [];
    for (var i = 0, l = defs.length; i < l; i++) {
        r.push( defs[i].js('defs') );
    }
    return r.join('\n\n');
};

asts.block.js__matcher = function() {
    var matcher = {};
    this.Templates.iterate(function(template) {
        addToMatcher(template);
    });

    // FIXME: Как-то засунуть это в шаблоны.
    var r1 = [];
    for (var k1 in matcher) {
        var r2 = [];
        var v1 = matcher[k1];
        for (var k2 in v1) {
            r2.push('        "' + k2 + '": [ ' + v1[k2].join(', ') + ' ]');
        }
        r1.push('    "' + k1 + '": {\n' + r2.join(',\n') + '\n    }');
    }

    return (r1.length) ? 'var matcher = {\n' + r1.join(',\n') + '\n};' : '';

    // local functions.

    function addToMatcher(template) {
        var mode = template.Mode.Value;
        var modeTemplates = matcher[mode];
        if (!modeTemplates) {
            modeTemplates = matcher[mode] = {};
        }

        var selector = template.Selector;
        var step;
        if (selector.is('root')) {
            step = '';
        } else {
            step = selector.lastName();
        }

        var stepTemplates = modeTemplates[step];
        if (!stepTemplates) {
            stepTemplates = modeTemplates[step] = [];
        }
        stepTemplates.unshift('t' + template.Tid);
        if (step == '*') {
            for (var t in modeTemplates) {
                if (t != '*') {
                    modeTemplates[t].unshift('t' + template.Tid);
                }
            }
        }
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_exprs.jssep$output = '\n';
asts.block_exprs.jssep$listitem = '\n';

asts.block_templates.jssep$ = '\n\n';

asts.block_templates.jssep$defs = '\n\n';

asts.callargs.jssep$ = ', ';

asts.string_content.jssep$ = ' + ';

asts.xml_attrs.jssep$open = ',\n';

asts.jpath_steps.jssep$compiled = ', ';

asts.arglist.jssep$defaults = '\n';

//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_line.js__content = function() {
    var items = [];
    this.toResult(items);

    var r = [];
    var s = '';
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (typeof item == 'string') {
            s += item;
        } else {
            if (s) {
                r.push(s);
                s = '';
            }
            r.push(item); // FIXME: item -> make('string_literal')
        }
    }
    if (s) {
        r.push(s); // FIXME:
    }

    for (var i = 0, l = r.length; i < l; i++) {
        var item = r[i];
        if (typeof item == 'string') {
            r[i] = common.quote(item);
        } else {
            r[i] = item.js();
        }
    }

    return r.join(' + ') || "''"; // FIXME: В случае, когда xml_line состоит из одного, скажем, </img>, должна выводиться хотя бы пустая строка.
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_exprs.yate__ = function() {
    var exprs = [];
    var indent = 0;

    // XML indents

    this.iterate(function(expr) {
        var delta = 0;
        if (expr.is('xml_line')) {
            expr.iterate(function(item) {
                if (item.is('xml_start')) {
                    delta++;
                } else if (item.is('xml_end')) {
                    delta--;
                }
            });
        }
        if (delta < 0) indent--;
        exprs.push( expr.yate().replace(/^/gm, Array(indent + 1).join('    ')) );
        if (delta > 0) indent++;
    });

    return exprs.join('\n');
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_templates.yatesep$ = '\n\n';

asts.block_defs.yatesep$ = '\n';

asts.arglist.yatesep$ = ', ';

asts.callargs.yatesep$ = ', ';

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = asts;

//  ---------------------------------------------------------------------------------------------------------------  //

