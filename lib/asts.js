var common = require('parse-tools/common.js');

var types = require('./types.js');
var Scope = require('./scope.js');
var consts = require('./consts.js');

var AST = require('./ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var asts = {};



//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._init = function(items) {
    this.p = common.makeArray(items || []);
};

asts.items._initProps = function() {
    this.p = [];
    this.f = {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.add = function(item) {
    this.p.push(item);
};

asts.items.last = function() {
    var items = this.p;
    return items[items.length - 1];
};

asts.items.empty = function() {
    return (this.p.length == 0);
};

asts.items.iterate = function(callback) {
    var items = this.p;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], i);
    }
};

asts.items.length = function() {
    return this.p.length;
};

asts.items.grep = function(callback) {
    var items = this.p;
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
    return this.p.map(callback);
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

    var sep = this[lang + 'sep__' + mode] || '';

    return r.join(sep);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toString = function() {
    if (this.p.length > 0) {
        var r = this.p.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
asts.items.someIs = function(callback) {
    var items = this.p;

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
    var items = this.p;

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
    var items = this.p;

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
    var items = this.p;
    for (var i = 0, l = items.length; i < l; i++) {
        callback( items[i], params );
    }
};

asts.items.walkAfter = function(callback, params, pKey, pObject) {
    var items = this.p;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkAfter(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

asts.items.walkBefore = function(callback, params) {
    callback(this, params);

    var items = this.p;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkBefore(callback, params, i, items);
    }
};

asts.items.mergeWith = function(ast) {
    this.p = this.p.concat(ast.p);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._getType = function() {
    var items = this.p;
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

asts.items.isConst = function() {
    return this.allIs('isConst');
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.getScope = function() {
    var items = this.p;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};



//  ---------------------------------------------------------------------------------------------------------------  //
//  module
//  ---------------------------------------------------------------------------------------------------------------  //

asts.module = {};



//  ---------------------------------------------------------------------------------------------------------------  //
//
//  block and body:
//
//    * body
//    * block
//        * block_imports
//        * block_defs
//        * block_templates
//        * block_exprs
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  body
//  ---------------------------------------------------------------------------------------------------------------  //

asts.body = {};

asts.body._getType = function() {
    return this.p.Block.type();
};

asts.body.closes = function() {
    return this.p.Block.closes();
};

asts.body.oncast = function(to) {
    this.p.Block.cast(to);
};

asts.body.setPrevOpened = function(prevOpened) {
    this.p.Block.setPrevOpened(prevOpened);
};

asts.body.isLocal = function() {
    return this.p.Block.isLocal();
};

asts.body.inline = function() {
    return this.p.Block.inline();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  block
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block = {};

asts.block.options = {
    scope: true,
    order: [ 'Defs', 'Templates', 'Exprs' ] //// , 'AsList' ]
};

asts.block._init = function(exprs) {
    var p = this.p;
    p.Imports = this.make('block_imports');
    p.Defs = this.make('block_defs');
    p.Templates = this.make('block_templates');
    p.Exprs = this.make('block_exprs', exprs);
};

asts.block._getType = function() {
    return this.p.Exprs.type();
};

asts.block.action = function() {
    /// this.Exprs.AsList = this.AsList;

    if ( this.p.Defs.empty() && this.p.Templates.empty() && this.p.Exprs.inline() ) {
        this.f.Inline = true;
    }
};

asts.block.oncast = function(to) {
    this.p.Exprs.cast(to);
};

asts.block.closes = function() {
    //  FIXME: Может таки унести это в block_exprs.closes?
    var exprs = this.p.Exprs.p;
    if (!exprs.length) { return false; }

    return exprs[0].closes();
};

asts.block.setPrevOpened = function(prevOpened) {
    this.prevOpened = prevOpened;
};

asts.block.mergeWith = function(block) {
    this.p.Templates.mergeWith(block.p.Templates);
    this.p.Defs.mergeWith(block.p.Defs);
    this.p.Exprs.mergeWith(block.p.Exprs);
};

asts.block.isLocal = function() {
    return this.p.Exprs.isLocal();
};

asts.block.inline = function() {
    return (
        this.p.Templates.empty() &&
        !this.scope.defs.length &&
        this.p.Exprs.length() === 1 &&
        this.p.Exprs.Items[0].inline()
    );
};

asts.block.js__matcher = function() {
    //  Группируем шаблоны по модам.
    var groups = {};
    this.p.Templates.iterate(function(template) {
        var mode = template.p.Mode.p.Value;

        var info = groups[mode];
        if (!info) {
            info = groups[mode] = {
                templates: [],
                matcher: {}
            };
        }

        info.templates.push(template);
        var steps = template.p.Selectors.getLastSteps();
        for (var i = 0, l = steps.length; i < l; i++) {
            var step = steps[i];
            if ( !info.matcher[step] ) {
                info.matcher[step] = [];
            }
        }
    });

    //  В groups у нас получается такая структура.
    //  На верхнем уровне объект, ключами в котором -- моды.
    //  Значения -- объект с двумя полями:
    //
    //    * templates -- линейный список всех шаблонов с такой модой
    //    * matcher -- объект, который станет куском глобального matcher'а.
    //      в нем ключи -- это имена нод, а значениями пока что пустые массивы.
    //      Дальнейший код разложит шаблоны по этим пустым массивам.
    //

    var matcher = {};

    for (var mode in groups) {
        var info = groups[mode];

        var templates = info.templates;
        for (var i = 0, l = templates.length; i < l; i++) {
            var template = templates[i];
            var tid = 't' + template.Id;

            var steps = template.p.Selectors.getLastSteps();
            for (var j = 0, m = steps.length; j < m; j++) {
                var step = steps[j];
                info.matcher[step].unshift(tid);
                if (step === '*') {
                    for (var name in info.matcher) {
                        if (name !== '*' && name !== '') {
                            info.matcher[name].unshift(tid);
                        }
                    }
                }
            }
        }
        matcher[mode] = info.matcher;
    }

    return JSON.stringify(matcher, null, 4);
};

asts.block.js__defs = function() {
    var defs = this.scope.defs;
    var r = [];
    for (var i = 0, l = defs.length; i < l; i++) {
        r.push( defs[i].js('defs') );
    }
    return r.join('\n\n');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_imports
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_imports = {};

asts.block_imports.options = {
    mixin: 'items'
};

asts.block_imports.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_defs
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_defs = {};

asts.block_defs.options = {
    mixin: 'items'
};

asts.block_defs.jssep__global_def = '\n';

asts.block_defs.yatesep__ = '\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_templates
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_templates = {};

asts.block_templates.options = {
    mixin: 'items'
};

asts.block_templates.jssep__ = '\n\n';

asts.block_templates.jssep__defs = '\n\n';

asts.block_templates.yatesep__ = '\n\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_exprs
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
    if ( this.type() !== 'xml' && this.p.AsType !== 'xml' ) { return; }

    var items = this.p;
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

    this.p = o;
};

asts.block_exprs.jssep__output = '\n';

asts.block_exprs.jssep__listitem = '\n';

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
//
//  declarations:
//
//    * template
//        * template_selectors
//        * template_mode
//    * var_
//    * function_
//    * key
//    * external
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  template
//  ---------------------------------------------------------------------------------------------------------------  //

asts.template = {};

asts.template.action = function() {
    this.f.Id = this.state.tid++;
};

asts.template.setTypes = function() {
    this.p.Body.cast( this.type() );
};

asts.template._getType = function() {
    var type = this.p.Body.type();
    if (type == 'array' || type == 'object') {
        return type;
    }
    return 'xml';
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  template_selectors
//  ---------------------------------------------------------------------------------------------------------------  //

asts.template_selectors = {};

asts.template_selectors.options = {
    mixin: 'items'
};

asts.template_selectors.getLastSteps = function() {
    var steps = [];
    this.iterate(function(selector) {
        var step = ( selector.isRoot() ) ? '' : selector.lastName();
        if (steps.indexOf(step) === -1) {
            steps.push(step);
        }
    });
    return steps;
};

asts.template_selectors.validate = function() {
    this.iterate(function(selector) {
        selector.validateMatch();
    });
};

asts.template_selectors.jssep__template_selector = ', ';
asts.template_selectors.jssep__template_abs = ', ';

asts.template_selectors.yatesep__ = ' | ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  template_mode
//  ---------------------------------------------------------------------------------------------------------------  //

asts.template_mode = {};


//  ---------------------------------------------------------------------------------------------------------------  //
//  var_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.var_ = {};

asts.var_.action = function() {
    var vars = this.scope.vars;
    var name = this.p.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    this.f.Id = this.state.vid++;
    this.f.Type = 'user';

    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.f.Lazy = true;
    }

    vars[name] = this;
};

asts.var_._getType = function() {
    return this.p.Value.type();
};

asts.var_.setTypes = function() {
    this.p.Value.cast();
};

asts.var_.prepare = function() {
    var Value = this.p.Value;
    //  Выставляем значению переменной специальный флаг.
    if ( Value.inline() ) {
        if (Value.type() === 'attr') {
            Value.Value.InlineVarValue = true;
        }
    } else {
        Value.rid();
    }
};

asts.var_.extractDefs = function() {
    this.scope.defs.push(this);
};

asts.var_.isConst = function() {
    return this.p.Value.isConst();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  function_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.function_ = {};

asts.function_.action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.f.Id = this.state.fid++;
    this.f.Type = 'user';

    functions[name] = this;
};

asts.function_.validate = function() {
    if (this.p.Body.type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

asts.function_._getType = function() {
    return this.p.Body.type();
};

asts.function_.setTypes = function() {
    this.p.Body.cast();
};

asts.function_.extractDefs = function() {
    this.scope.defs.push(this);
};

asts.function_.isLocal = function() {
    return this.p.Body.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  key
//  ---------------------------------------------------------------------------------------------------------------  //

asts.key = {};

asts.key.action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.f.Id = this.state.kid++;
    this.f.Type = 'key';

    functions[name] = this;
};

asts.key.validate = function() {
    if (!this.p.Nodes.type( 'nodeset' )) {
        this.p.Nodes.error('Nodeset is required');
    }
    var useType = this.p.Use.type();
    if (useType !== 'scalar' && useType !== 'nodeset') {
        this.p.Use.error('Scalar or nodeset is required');
    }
};

asts.key._getType = function() {
    return this.p.Body.type();
};

asts.key.prepare = function() {
    if (this.p.Use.type() !== 'nodeset') {
        this.p.Use.cast('scalar');
    }
    this.p.Body.cast();
};

asts.key.extractDefs = function() {
    this.scope.defs.push(this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  external
//  ---------------------------------------------------------------------------------------------------------------  //

asts.external = {};

asts.external.action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.p.External = true;

    functions[name] = this;
};

asts.external._getType = function() {
    return this.p.Type;
};



//  ---------------------------------------------------------------------------------------------------------------  //
//
//  block expressions:
//
//    * if_
//        * elses
//        * else_if
//        * else_
//    * for_
//    * apply
//    * value
//    * subexpr
//    * attr
//    * attrs_close
//    * attrs_open
//    * xml
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  if
//  ---------------------------------------------------------------------------------------------------------------  //

asts.if_ = {};

asts.if_.options = {
    base: 'expr'
};

asts.if_._init = function() {
    this.p.Elses = this.make('elses');
};

asts.if_._getType = function() {
    var type = this.p.Then.type();
    this.p.Elses.iterate(function(item) {
        type = types.commonType( type, item.type() );
    });
    return type;
};

asts.if_.setTypes = function() {
    this.p.Condition.cast('boolean');
    this.p.Elses.iterate(function(item) {
        if ( item.is('else_if') ) {
            item.Condition.cast('boolean');
        }
    });
};

asts.if_.oncast = function(to) {
    this.p.Then.cast(to);
    this.p.Elses.iterate(function(item) {
        item.Body.cast(to);
    });
};

asts.if_.closes = function() {
    return this.p.Then.closes() && this.p.Elses.allIs('closes');
};

asts.if_.setPrevOpened = function(prevOpened) {
    this.p.Then.setPrevOpened(prevOpened);
    this.p.Elses.iterate(function(item) {
        item.Body.setPrevOpened(prevOpened)
    });
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  elses
//  ---------------------------------------------------------------------------------------------------------------  //

asts.elses = {};

asts.elses.options = {
    mixin: 'items'
};

asts.elses.jssep__ = ' ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_if
//  ---------------------------------------------------------------------------------------------------------------  //

asts.else_if = {};

asts.else_if._getType = function() {
    return this.p.Body.type();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.else_ = {};

asts.else_._getType = function() {
    return this.p.Body.type();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  for_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.for_ = {};

asts.for_.options = {
    base: 'expr'
};

asts.for_._getType = function() {
    var type = this.p.Body.type();

    return types.joinType(type, type);
};

asts.for_.oncast = function(to) {
    this.p.Body.cast(to);
};

asts.for_.prepare = function() {
    this.p.Body.cid();
};

asts.for_.closes = function() {
    return this.p.Body.closes();
};

asts.for_.setPrevOpened = function(prevOpened) {
    this.p.Body.setPrevOpened(prevOpened);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  apply
//  ---------------------------------------------------------------------------------------------------------------  //

asts.apply = {};

asts.apply.options = {
    base: 'expr'
};

asts.apply._type = 'xml';

asts.apply.validate = function() {
    if ( !this.p.Expr.type('nodeset') ) {
        this.error('Type of expression should be NODESET');
    }
};

asts.apply.closes = common.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  value
//  ---------------------------------------------------------------------------------------------------------------  //

asts.value = {};

asts.value._getType = function() {
    return this.p.Value.type();
};

asts.value.oncast = function(to) {
    this.p.Value.cast(to);
};

asts.value.inline = function() {
    return this.p.Value.inline();
};

asts.value.closes = function() {
    return this.p.Value.closes();
};

asts.value.isLocal = function() {
    return this.p.Value.isLocal();
};

asts.value.isConst = function() {
    return this.p.Value.isConst();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.subexpr = {};

asts.subexpr._getType = function() {
    return this.p.Block.type();
};

asts.subexpr.oncast = function(to) {
    this.p.Block.cast(to);
};

asts.subexpr.closes = function() {
    return this.p.Block.closes();
};

asts.subexpr.setPrevOpened = function(prevOpened) {
    this.p.Block.setPrevOpened(prevOpened);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  attr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.attr = {};

asts.attr.options = {
    base: 'xml'
};

asts.attr._type = 'attr';

asts.attr.setTypes = function() {
    this.p.Name.cast('scalar');
    this.p.Value.cast('scalar');
};

asts.attr.prepare = function() {
    if (!this.p.Value.inline()) {
        this.p.Value.rid();
    }
};

asts.attr.closes = common.false;


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_close = {};

asts.attrs_close._type = 'xml';


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_open = {};

asts.attrs_open._init = function(item) {
    this.p.Name = item.p.Name;
    this.p.Attrs = item.p.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.make('attrs_open', ...),
    //  но setTypes для xml_attr случает раньше этого.
    this.p.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    item.p.Attrs = null;
};

asts.attrs_open._type = 'xml';



//  ---------------------------------------------------------------------------------------------------------------  //
//
//  xml:
//
//    * xml
//    * xml_line
//    * xml_start
//    * xml_end
//    * xml_empty
//    * xml_text
//    * xml_full
//    * xml_attrs
//    * xml_attr
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml = {};

asts.xml.options = {
    base: 'expr'
};

asts.xml._type = 'xml';


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_line
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
            opened.push(item.p.Name);
        } else if (item.is('xml_end')) {
            var name = opened.pop();
            if (!name) {
                that.error('Закрывающий тег </' + item.p.Name + '> не был предварительно открыт');
            } else if ( (item.p.Name !== name) && (item.p.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            item.p.Name = name; // FIXME: Не очень подходящее место для этого действия.
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
//  xml_start
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_start = {};

asts.xml_start.options = {
    base: 'xml'
};

asts.xml_start.toResult = function(result) {
    var name = this.p.Name;

    result.push('<' + name);
    if (!this.open) {
        this.p.Attrs.toResult(result);
        result.push( (consts.shortTags[name]) ? '/>' : '>' );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_end
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_end = {};

asts.xml_end.options = {
    base: 'xml'
};

asts.xml_end.action = function() {
    if (consts.shortTags[ this.p.Name ]) {
        this.f.Short = true;
    }
};

asts.xml_end.toResult = function(result) {
    if (!this.f.Short) {
        result.push('</' + this.p.Name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_empty
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_empty = {};

asts.xml_empty.options = {
    base: 'xml'
};

asts.xml_empty.toResult = function(result) {
    var name = this.p.Name;

    result.push('<' + name);
    this.p.Attrs.toResult(result);
    if ( consts.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_text
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_text = {};

asts.xml_text.options = {
    base: 'xml'
};

asts.xml_text.oncast = function(to) {
    this.p.Text.cast(to);
};

asts.xml_text.toResult = function(result) {
    this.p.Text.toResult(result);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_full
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_full = {};

asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attrs
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attrs = {};

asts.xml_attrs.options = {
    mixin: 'items'
};

asts.xml_attrs.jssep__open = ',\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attr = {};

asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.p.Name + '="');
    this.p.Value.toResult(result);
    result.push('"');
};

asts.xml_attr.prepare = function() {
    if ( !this.parent.parent.is('attrs_open') ) { // FIXME: Как бы не ходить по дереву так уродливо?
        this.p.Value.cast('attrvalue');
    } else {
        this.p.Value.cast('scalar');
    }
};



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

var _needCast = {
    'nodeset-scalar': true,
    'nodeset-xml': true,
    'nodeset-attrvalue': true,
    'nodeset-boolean': true,

    'scalar-xml': true,
    'scalar-attrvalue': true,

    'xml-attrvalue': true
};

asts.inline_expr.transform = function() {
    if (this.p.AsType) {
        if ( this.isSimple() && this.p.AsType === 'scalar' ) {
            return this.make( 'simple_jpath', this );
        } else if ( needCast( this.type(), this.p.AsType ) ) {
            return this.make( 'cast', { to: this.p.AsType, expr: this } );
        } else {
            return this;
        }
    }

    function needCast(from, to) {
        return _needCast[from + '-' + to];
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_op
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_op = {};

asts.inline_op.options = {
    base: 'inline_expr'
};

asts.inline_op.setTypes = function() {
    var signature = this.signature;
    if (signature) {
        this.p.Left.cast(signature.left);
        if (this.p.Right) {
            this.p.Right.cast(signature.right);
        }
    }
};

asts.inline_op.isLocal = function() {
    return this.p.Left.isLocal() || ( this.p.Right && this.p.Right.isLocal() );
};

asts.inline_op._getType = function() {
    return this.signature.result;
};

asts.inline_op.getScope = function() {
    var lscope = this.p.Left.getScope();
    if (this.p.Right) {
        var rscope = this.p.Right.getScope();
        return Scope.commonScope( lscope, rscope );
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

asts.inline_eq.setTypes = function() {
    var Left = this.p.Left;
    var Right = this.p.Right;

    var lType = Left.type();
    var rType = Right.type();

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
    base: 'inline_expr'
};

asts.inline_number.isLocal = common.false;

asts.inline_number.isConst = common.true;

asts.inline_number._type = 'scalar';


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_string = {};

asts.inline_string.options = {
    base: 'inline_expr'
};

asts.inline_string._type = 'scalar';

asts.inline_string.oncast = function(to) {
    this.p.Value.cast(to);

    return false;
};

asts.inline_string.toResult = function(result) {
    this.p.Value.toResult(result);
};

asts.inline_string.asString = function() {
    var s = '';

    var items = this.p.Value.p;
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        s += item.asString();
    }

    return s;
};

asts.inline_string.isConst = function() {
    return this.p.Value.isConst();
};

asts.inline_string.isLocal = function() {
    return this.p.Value.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_content
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_content = {};

asts.string_content.options = {
    mixin: 'items'
};

asts.string_content._type = 'scalar';

asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_expr = {};

asts.string_expr.options = {
    base: 'inline_expr'
};

asts.string_expr._init = function(expr) {
    this.p.Expr = expr;
};

asts.string_expr._getType = function() {
    return this.p.Expr.type();
};

asts.string_expr.isLocal = function() {
    return this.p.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_literal
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_literal = {};

asts.string_literal.options = {
    base: 'inline_expr'
};

asts.string_literal._init = function(s) {
    this.p.Value = s;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
asts.string_literal.yate = function() {
    return this.p.Value;
};

asts.string_literal._type = 'scalar';

asts.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.p.Value = common.quoteAttr(this.p.Value);
    } else if (to === 'xml') {
        this.p.Value = common.quoteText(this.p.Value);
    }

    return false;
};

asts.string_literal.stringify = function() {
    return JSON.stringify( this.p.Value );
};

asts.string_literal.asString = function() {
    return this.p.Value;
};

asts.string_literal.isConst = common.true;

asts.string_literal.isLocal = common.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_subexpr = {};

asts.inline_subexpr.options = {
    base: 'inline_expr'
};

asts.inline_subexpr.isLocal = function() {
    return this.p.Expr.isLocal();
};

asts.inline_subexpr._getType = function() {
    return this.p.Expr.type();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_var
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_var = {};

asts.inline_var.options = {
    base: 'inline_expr'
};

asts.inline_var.action = function() {
    this.def = this.scope.findVar(this.p.Name);
    if (!this.def) {
        this.error('Undefined variable ' + this.p.Name);
    }
};

asts.inline_var._getType = function() {
    return this.def.type();
};

asts.inline_var.isLocal = common.false;

asts.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.p.Name).scope;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_function
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_function = {};

asts.inline_function.options = {
    base: 'inline_expr'
};

asts.inline_function._getType = function() {
    if (this.def.Type === 'internal') {
        return this.signature.type;
    }

    return this.def.type();
};

asts.inline_function.action = function() {
    var name = this.p.Name;

    //  Ищем функцию в scope'ах.
    var def = this.scope.findFunction(name);

    if (!def) {
        //  Ищем среди внутренних функций.
        def = internalFunctions[name];

        //  Среди уже инстанцированных нет, смотрим, есть ли определение для внутренней функции.
        var params;
        if ( !def && (( params = consts.internalFunctions[name] )) ) {
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

    if (def.External) {
        this.f.External = true;
    } else if (def.Type == 'user') {
        this.f.IsUser = true;
    } else if (def.Type == 'key') {
        this.f.IsKey = true;
    } else {
        this.signature = def.findSignature(this.p.Args.p);
        if (!this.signature) {
            this.error('Cannot find signature for this arguments');
        }
    }
};

asts.inline_function.prepare = function() {
    var def = this.def;
    var args = this.p.Args.p;

    if (def.External) {
        var argTypes = def.ArgTypes;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( argTypes[i] || 'scalar' );
        }

    } else if (def.Type == 'key') {
        var type = args[0].type();
        if (type !== 'nodeset') {
            args[0].cast('scalar');
        }

    } else if (def.Type == 'internal') {
        var signature = this.signature;
        var types = signature.args;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( types[i] );
        }

    } else if (def.Type == 'user') {
        var defArgs = def.Args.Items;
        for (var i = 0, l = args.length; i < l; i++) {
            args[i].cast( defArgs[i].Typedef || 'scalar' );
        }

    }
};

asts.inline_function.getScope = function() {
    //  Если в предикате используется вызов функции,
    //  то определение этого jpath'а нужно выводить в этом же scope.
    //  См. ../tests/functions.18.yate
    return this.scope;
};

asts.inline_function.isLocal = function() {
    var name = this.p.Name;

    if (this.def.Type === 'internal') {
        if (this.signature.local) {
            return true;
        }

        var args = this.p.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if (args[i].isLocal()) { return true; }
        }
        return false;

    }

    if (this.f.External || this.f.IsKey) {
        var args = this.p.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if (args[i].isLocal()) { return true; }
        }
        return false;
    }

    return this.def.isLocal();
};

asts.inline_function.js__internal = function() {
    var signature = this.signature;
    this.p.Signature = signature.args.join(',');
    return AST.js.generate('internal_function_' + this.p.Name, this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_internal_function
//  ---------------------------------------------------------------------------------------------------------------  //

//  Сюда будем складывать инстансы inline_internal_function.
//  Определения для них лежат в yate-consts.js, а создаются они в inline_function.action.
var internalFunctions = {};

asts.inline_internal_function = {};

asts.inline_internal_function._init = function(params) {
    this.p.Name = params.name;
    var signatures = this.signatures = params.signatures;
    for (var i = 0, l = signatures.length; i < l; i++) {
        var signature = signatures[i];
        signature.args = signature.args || [];
    }
    this.f.Type = 'internal';
};

asts.inline_internal_function.findSignature = function(callargs) {
    var signatures = this.signatures;

    for (var i = 0, l = signatures.length; i < l; i++) {
        var signature = signatures[i];
        //  Смотрим, подходят ли переданные аргументы под одну из сигнатур.
        if ( checkArgs(signature.args, callargs) ) {
            return signature;
        }
    }

    function checkArgs(args, callargs) {
        for (var i = 0, l = callargs.length; i < l; i++) {
            var callarg = callargs[i];
            var arg = args[i];

            //  Для каждого переданного аргумента должен быть
            //      а) формальный аргумент
            //      б) тип переданного аргумента должен приводиться к типу формального.
            if ( !arg || !types.convertable( callarg.type(), arg ) ) {
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
    base: 'inline_expr'
};

asts.quote._init = function(params) {
    this.p.Expr = params.expr;
    this.p.Mode = params.mode;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  cast
//  ---------------------------------------------------------------------------------------------------------------  //

asts.cast = {};

asts.cast.options = {
    base: 'inline_expr'
};

asts.cast._init = function(params) {
    var to = params.to;
    var expr = params.expr;

    this.p.From = expr.type();
    this.p.To = to;
    this.p.Expr = expr;
    this.mode = expr.mode;
};

asts.cast._getType = function() {
    return this.p.To;
};

asts.cast.isLocal = function() {
    return this.p.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  sort
//  ---------------------------------------------------------------------------------------------------------------  //

asts.sort = {};

asts.sort.options = {
    base: 'inline_expr'
};

asts.sort._type = 'nodeset';

asts.sort.validate = function() {
    if (this.p.Nodes.type() !== 'nodeset') {
        this.p.Nodes.error('Type should be nodeset.');
    }
};

asts.sort.prepare = function() {
    this.p.By.cast('scalar');
};



//  ---------------------------------------------------------------------------------------------------------------  //
//
//  jpath:
//
//    * jpath
//    * jpath_steps
//    * jpath_dors
//    * jpath_predicate
//    * jpath_filter
//    * simple_jpath
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath = {};

asts.jpath.options = {
    base: 'inline_expr'
};

asts.jpath._type = 'nodeset';

asts.jpath.isLocal = function() {
    return !this.p.Abs;
};

asts.jpath.isSimple = function() {
    var steps = this.p.Steps.p;
    return ( steps.length === 1 && steps[0].is('jpath_nametest') );
};

asts.jpath.isRoot = function() {
    return this.p.Abs && this.p.Steps.empty();
};

asts.jpath.validate = function() {
    var context = this.p.Context;
    if (context && !context.type( 'nodeset' )) {
        context.error('Invalid type. Should be NODESET');
    }
};

asts.jpath.validateMatch = function() {
    var steps = this.p.Steps.p;
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        if ( step.is('jpath_dots') ) {
            step.error('You can\'t use parent axis in match');
        }
        if ( step.is('jpath_predicate') && !step.isMatchable() ) {
            step.error('You can\'t use index in match');
        }
    }
};

// oncast = function() {},

// Возвращаем значение последнего nametest'а или же ''.
// Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
asts.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.p.Steps.p;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if (step.is('jpath_nametest')) {
            return step.Name;
        }
    }
    return '';
};

asts.jpath.getScope = function() {
    return this.p.Steps.getScope();
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

    this.f.Id = jid; // Запоминаем id-шник.
    this.f.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_steps
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_steps = {};

asts.jpath_steps.options = {
    mixin: 'items'
};

asts.jpath_steps.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_dots
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_dots = {};

asts.jpath_dots.action = function() {
    this.p.Length = this.p.Dots.length - 1;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_predicate
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_predicate = {};

asts.jpath_predicate.getScope = function() {
    if ( this.isLocal() ) {
        return this.p.Expr.getScope();
    } else {
        //  FIXME: Временный костыль. Выражение .item[ /.index ] должно быть индексом,
        //  но из-за того, что оно глобальное, оно уезжает в глобальный scope.
        //  А индексы у меня сейчас не предусмотрены глобальные, т.к. там выражение
        //  явно генерится, без функциональной обертки.
        return this.scope;
    }
};

asts.jpath_predicate.isLocal = function() {
    return this.p.Expr.isLocal();
};

asts.jpath_predicate.isMatchable = function() {
    return this.p.Expr.isLocal() || this.p.Expr.type() === 'boolean';
};

asts.jpath_predicate.setTypes = function() {
    if (this.isLocal() || this.p.Expr.type() === 'boolean') { // .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.p.Expr.cast( 'boolean' );
    } else { // .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.p.Expr.cast( 'scalar' );
    }
};

asts.jpath_predicate.extractDefs = function() {
    var key = this.p.Expr.yate(); // Каноническая запись предиката.

    var state = this.state;
    var scope = this.getScope(); // См. примечание в jpath.action() (jpath.js).

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    this.f.Id = pid;
    this.f.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_filter
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_filter = {};

asts.jpath_filter.options = {
    base: 'inline_expr'
};

asts.jpath_filter._init = function(params) {
    this.p.Expr = params.expr;
    this.p.JPath = params.jpath;
};

asts.jpath_filter._type = 'nodeset',

asts.jpath_filter.isLocal = function() {
    return this.p.Expr.isLocal() || this.p.JPath.isLocal();
};

asts.jpath_filter.getScope = function() {
    return Scope.commonScope( this.p.Expr.getScope(), this.p.JPath.getScope() );
};

asts.jpath_filter.validate = function() {
    if (!this.p.Expr.type( 'nodeset' )) {
        this.p.Expr.error('Type should be NODESET');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  simple_jpath
//  ---------------------------------------------------------------------------------------------------------------  //

asts.simple_jpath = {};

asts.simple_jpath.options = {
    base: 'inline_expr'
};

asts.simple_jpath._init = function(jpath) {
    this.p.JPath = jpath;
    this.p.Name = jpath.Steps.Items[0].Name;
};

asts.simple_jpath.isLocal = function() {
    return this.p.JPath.isLocal();
};

asts.simple_jpath.getScope = function() {
    return this.p.JPath.getScope();
};



//  ---------------------------------------------------------------------------------------------------------------  //
//
//  arguments:
//
//    * arglist
//    * arglist_item
//    * callargs
//    * callarg
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  arglist
//  ---------------------------------------------------------------------------------------------------------------  //

asts.arglist = {};

asts.arglist.options = {
    mixin: 'items'
};

asts.arglist.jssep__defaults = '\n';

asts.arglist.yatesep__ = ', ';

asts.callargs.yatesep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  arglist_item
//  ---------------------------------------------------------------------------------------------------------------  //

asts.arglist_item = {};

asts.arglist_item.action = function() {
    //  FIXME: Очень уж хрупкая конструкция.
    //  NOTE: Смысл в том, что в AST параметры и блок на одном уровне, а отдельный scope создается
    //  только для блока. И аргументы нужно прописывать именно туда.
    var blockScope = this.parent.parent.p.Body.p.Block.scope;
    var vars = blockScope.vars;

    var name = this.p.Name;
    if ( vars[name] ) {
        this.error('Повторное определение аргумента ' + name);
    }

    vars[name] = this;
    //  Заодно меняем и scope.
    this.scope = blockScope;

    this.f.Id = this.state.vid++;
};

asts.arglist_item.isConst = common.false;

asts.arglist_item._getType = function() {
    if (this.p.Typedef == 'nodeset') { return 'nodeset'; }
    if (this.p.Typedef == 'boolean') { return 'boolean'; }
    if (this.p.Typedef == 'xml') { return 'xml'; }
    return 'scalar';
};

asts.arglist_item.prepare = function() {
    if (this.p.Default) {
        this.p.Default.cast( this.type() );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  callargs
//  ---------------------------------------------------------------------------------------------------------------  //

asts.callargs = {};

asts.callargs.options = {
    mixin: 'items'
};

asts.callargs.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  callarg
//  ---------------------------------------------------------------------------------------------------------------  //

asts.callarg = {};

asts.callarg.options = {
    base: 'inline_expr'
};

asts.callarg.type = function() {
    return this.p.Expr.type();
};

asts.callarg.isLocal = function() {
    return this.p.Expr.isLocal();
};

asts.callarg.oncast = function(to) {
    this.p.Expr.cast(to);
};



//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = asts;

/*
//  ---------------------------------------------------------------------------------------------------------------  //

asts.pair = {};

asts.pair._type = 'pair',

asts.pair.setTypes = function() {
    this.p.Key.cast('scalar');

    var type = this.p.Value.type();
    if (type == 'array' || type == 'object') {
        this.p.Value.cast(type);
    } else {
        this.p.Value.cast('xml'); // FIXME: А не scalar?
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.array = {};

asts.array._type = 'array';

asts.array.action = function() {
    this.Block.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.object = {};

asts.object._type = 'object',

asts.object.action = function() {
    this.Block.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
*/

