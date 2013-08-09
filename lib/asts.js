var yate = require('./yate.js');

require('./types.js');
require('./scope.js');
require('./consts.js');
require('./ast.js');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

var asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items = {};

asts.items._init = function() {
    this.Items = [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.add = function(item) {
    this.Items.push(item);
};

asts.items.length = function() {
    return this.Items.length;
};

asts.items.first = function() {
    return this.Items[0];
};

asts.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

asts.items.empty = function() {
    return (this.Items.length === 0);
};

asts.items.iterate = function(callback) {
    this.Items.forEach(callback);
};

asts.items.iterateBack = function(callback) {
    this.Items.reverse().forEach(callback);
};

asts.items.grep = function(callback) {
    return this.Items.filter(callback);
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

    var sep = this[lang + 'sep__' + mode] || '';

    return r.join(sep);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id + '\n' + r;
    }
    return '';
};

/*
asts.items.toJSON = function() {
    return this.map(function(item) {
        return item.toJSON();
    });
};
*/

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

asts.items.apply = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], params);
    }
};

asts.items.walkdo = function(callback, params, pKey, pObject) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

asts.items.dowalk = function(callback, params) {
    callback(this, params);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

asts.items.mergeWith = function(ast) {
    this.Items = ast.p.Items.concat(this.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._getType = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var currentId = items[0].id;
    var currentType = items[0].getType();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var nextType = item.getType();

        var commonType = yate.types.joinType(currentType, nextType);
        if (commonType == 'none') {
            item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
        }
        currentId = item.id;
        currentType = commonType;
    }

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
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //
//  module
//  ---------------------------------------------------------------------------------------------------------------  //

asts.module = {};

asts.module.options = {
    props: 'Name Block'
};

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

asts.body.options = {
    props: 'Block'
};

asts.body._getType = function() {
    return this.Block.getType();
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

asts.body.isLocal = function() {
    return this.Block.isLocal();
};

asts.body.inline = function() {
    return this.Block.inline();
};

asts.body.setAsList = function() {
    this.f.AsList = true;
    this.Block.setAsList();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  block
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block = {};

asts.block.options = {
    props: 'Items Defs Templates Exprs',

    scope: true
};

asts.block._init = function() {
    //  Хранилище всего содержимого блока. Заполняется при парсинге.
    //  FIXME: А нужно же удалить эти Items после того,
    //  как мы разложили все по кучкам.
    this.Items = this.make('block_items');

    /*
    //  После парсинга все элементы блока раскладываются на отдельные кучки.
    //  p.Includes = this.make('block_includes');
    //  p.Imports = this.make('block_imports');
    this.Defs = this.make('block_defs');
    this.Templates = this.make('block_templates');
    this.Exprs = this.make('block_exprs');
    */
};

asts.block._getType = function() {
    return this.Exprs.getType();
};

asts.block.w_setTypes = function() {
    if (this.f.AsList) {
        this.Exprs.iterate(function(item) {
            if (item.getType() === 'nodeset') {
                item.cast('scalar');
            } else {
                item.cast();
            }
        });
    }
};

asts.block.w_deinclude = function() {
    var a = [];

    this.Items.iterate(function(item) {
        if (item.id === 'include') {
            var ast = yate.parse(item.Filename, 'module');
            ast.dowalk(function(ast) {
                ast.w_deinclude();
            });
            a = a.concat(ast.Block.Items.Items);
        } else {
            a.push(item);
        }
    });

    this.Items.Items = a;
};

asts.block.w_deimport = function() {
    var a = [];
    var imports = [];

    this.Items.iterate(function(item) {
        if (item.id === 'import') {
            var name = item.p.Name;
            var module = yate.modules[name];
            if (!module) {
                item.error('Cannot find module "' + name + '"');
            }

            imports.push(name);

            var defs = module.defs;
            var input = new pt.InputStream( { filename: module.filename } );

            var b = [];
            for (var i = 0, l = defs.length; i < l; i++) {
                var def = defs[i];
                var ast = yate.AST.fromJSON(def, input);
                ast.f.isImported = true;
                b.push(ast);

                switch (ast.id) {
                    case 'var_':
                        ast.state.vid = ast.p.Id + 1;
                        break;
                    case 'function_':
                        ast.state.fid = ast.p.Id + 1;
                        break;
                    case 'key':
                        ast.state.kid = ast.p.Id + 1;
                }
            }
            a = b.concat(a);

        } else {
            a.push(item);
        }
    });

    this.Items.p.Items = a;
    this.Imports = JSON.stringify(imports);
};

asts.block.w_deitemize = function() {
    var Defs = this.Defs;
    var Templates = this.Templates;
    var Exprs = this.Exprs;

    //  FIXME: Без этой проверки каким-то образом этот код вызывается повторно.
    if (this.Items) {
        this.Items.iterate(function(item) {
            switch (item.id) {
                case 'template':
                    Templates.add(item);
                    break;

                case 'key':
                case 'function_':
                case 'var_':
                case 'external':
                    Defs.add(item);
                    break;

                default:
                    Exprs.add(item);
            }

        });

        this.Items = null;
    }
};

asts.block.oncast = function(to) {
    this.Exprs.cast(to);
};

asts.block.closes = function() {
    //  FIXME: Может таки унести это в block_exprs.closes?
    var exprs = this.Exprs;
    if ( exprs.empty() ) { return false; }

    return exprs.first().closes();
};

asts.block.setPrevOpened = function(prevOpened) {
    this.prevOpened = prevOpened;
};

asts.block.mergeWith = function(block) {
    this.Imports.mergeWith(block.p.Imports);
    this.Defs.mergeWith(block.p.Defs);
    this.Templates.mergeWith(block.p.Templates);
    this.Exprs.mergeWith(block.p.Exprs);
};

asts.block.isLocal = function() {
    return this.Exprs.isLocal();
};

asts.block.inline = function() {
    return (
        this.Templates.empty() &&
        !this.scope.defs.length &&
        this.Exprs.length() === 1 &&
        this.Exprs.first().inline()
    );
};

asts.block.js__matcher = function() {
    //  Группируем шаблоны по модам.
    var groups = {};
    this.Templates.iterate(function(template) {
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
            var tid = 't' + template.p.Id;

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

asts.block.setAsList = function() {
    this.f.AsList = true;
    this.Exprs.iterate(function(item) {
        item.setAsList();
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  block_items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_items = {};

asts.block_items.options = {
    mixin: 'items'
};

asts.block_items.yatesep__ = '\n';

/*
//  FIXME: Сделать инденты при выводе.
asts.block_items.yate__ = function() {
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
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  block_imports
//  ---------------------------------------------------------------------------------------------------------------  //

/*
asts.block_imports = {};

asts.block_imports.options = {
    mixin: 'items'
};

asts.block_imports.jssep__ = ', ';
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  block_includes
//  ---------------------------------------------------------------------------------------------------------------  //

asts.block_includes = {};

asts.block_includes.options = {
    mixin: 'items'
};


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

asts.block_exprs.w_validate = function() {
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

asts.block_exprs.w_prepare = function() {
    if ( this.parent.f.AsList ) { return; }
    if ( this.getType() !== 'xml' && this.AsType !== 'xml' ) { return; }

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

asts.block_exprs.jssep__output = '\n';

asts.block_exprs.jssep__listitem = '\n';

//  ---------------------------------------------------------------------------------------------------------------  //


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

asts.template.options = {
    props: 'Body'
};

asts.template.w_action = function() {
    this.Id = this.state.tid++;
};

asts.template.w_setTypes = function() {
    this.Body.cast( this.getType() );
};

asts.template._getType = function() {
    var type = this.Body.getType();
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

asts.template_selectors.w_validate = function() {
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

asts.template_mode.options = {
    props: 'Name'
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  var_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.var_ = {};

asts.var_.options = {
    props: 'Name Value'
};

asts.var_.w_action = function() {
    var vars = this.scope.vars;
    var name = this.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    if (this.Id === undefined) {
        this.Id = this.state.vid++;
    }
    this.f.IsUser = true;

    /*
    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.f.Lazy = true;
    }
    */

    vars[name] = this;
};

asts.var_._getType = function() {
    return this.Value.getType();
};

asts.var_.w_setTypes = function() {
    this.Value.cast();
};

asts.var_.w_prepare = function() {
    var Value = this.Value;
    //  Выставляем значению переменной специальный флаг.
    if ( Value.inline() ) {
        if (Value.getType() === 'attr') {
            Value.p.Value.f.InlineVarValue = true;
        }
    } else {
        Value.rid();
    }
};

asts.var_.w_extractDefs = function() {
    this.scope.defs.push(this);
};

asts.var_.isConst = function() {
    return this.Value.isConst();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  function_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.function_ = {};

asts.function_.options = {
    props: 'Name Body'
};

asts.function_.w_action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    if (this.Id === undefined) {
        this.Id = this.state.fid++;
    }
    this.f.IsUser = true;

    functions[name] = this;
};

asts.function_.w_validate = function() {
    if (this.Body.getType() === 'undef') {
        this.error('Undefined type of return value');
    }
};

asts.function_._getType = function() {
    return this.Body.getType();
};

asts.function_.w_setTypes = function() {
    this.Body.cast();
};

asts.function_.w_extractDefs = function() {
    this.scope.defs.push(this);
};

asts.function_.isLocal = function() {
    return this.Body.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  key
//  ---------------------------------------------------------------------------------------------------------------  //

asts.key = {};

asts.key.options = {
    props: 'Name Nodes Use Body'
};

asts.key.w_action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    if (this.Id === undefined) {
        this.Id = this.state.kid++;
    }
    this.f.IsKey = true;

    functions[name] = this;
};

asts.key.w_validate = function() {
    if ( !this.Nodes.getType('nodeset') ) {
        this.Nodes.error('Nodeset is required');
    }
    var useType = this.Use.getType();
    if (useType !== 'scalar' && useType !== 'nodeset') {
        this.Use.error('Scalar or nodeset is required');
    }
};

asts.key._getType = function() {
    return this.Body.getType();
};

asts.key.w_prepare = function() {
    if (this.Use.getType() !== 'nodeset') {
        this.Use.cast('scalar');
    }
    this.Body.cast();
};

asts.key.w_extractDefs = function() {
    this.scope.defs.push(this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  external
//  ---------------------------------------------------------------------------------------------------------------  //

asts.external = {};

asts.external.options = {
    props: 'Type Name ArgTypes'
};

asts.external.w_action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.f.IsExternal = true;

    functions[name] = this;
};

asts.external._getType = function() {
    return this.Type;
};

asts.external.w_extractDefs = function() {
    this.scope.defs.push(this);
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
    base: 'expr',
    props: 'Condition Then Elses'
};

asts.if_._init = function() {
    this.Elses = this.make('elses');
};

asts.if_._getType = function() {
    var type = this.Then.getType();
    this.Elses.iterate(function(item) {
        type = yate.types.commonType( type, item.getType() );
    });
    return type;
};

asts.if_.w_setTypes = function() {
    this.Condition.cast('boolean');
    this.Elses.iterate(function(item) {
        if ( item.is('else_if') ) {
            item.p.Condition.cast('boolean');
        }
    });
};

asts.if_.oncast = function(to) {
    this.Then.cast(to);
    this.Elses.iterate(function(item) {
        item.p.Body.cast(to);
    });
};

asts.if_.closes = function() {
    return this.Then.closes() && this.Elses.allIs('closes');
};

asts.if_.setPrevOpened = function(prevOpened) {
    this.Then.setPrevOpened(prevOpened);
    this.Elses.iterate(function(item) {
        item.p.Body.setPrevOpened(prevOpened);
    });
};

asts.if_.isLocal = function() {
    return this.Then.isLocal() || this.Elses.isLocal();
};

asts.if_.setAsList = function() {
    this.f.AsList = true;
    this.Then.setAsList();
    this.Elses.iterate(function(item) {
        item.setAsList();
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

asts.else_if.options = {
    props: 'Body'
};

asts.else_if._getType = function() {
    return this.Body.getType();
};

asts.else_if.closes = function() {
    return this.Body.closes();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.else_ = {};

asts.else_.options = {
    props: 'Body'
};

asts.else_._getType = function() {
    return this.Body.getType();
};

asts.else_.closes = function() {
    return this.Body.closes();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  for_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.for_ = {};

asts.for_.options = {
    base: 'expr',
    props: 'Selector Body'
};

asts.for_._getType = function() {
    var type = this.Body.getType();

    return yate.types.joinType(type, type);
};

asts.for_.oncast = function(to) {
    this.Body.cast(to);
};

asts.for_.w_prepare = function() {
    this.Body.cid();
};

asts.for_.closes = function() {
    return this.Body.closes();
};

asts.for_.setPrevOpened = function(prevOpened) {
    this.Body.setPrevOpened(prevOpened);
};

asts.for_.isLocal = function() {
    return this.Body.isLocal();
};

asts.for_.setAsList = function() {
    this.f.AsList = true;
    this.Body.setAsList();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  apply
//  ---------------------------------------------------------------------------------------------------------------  //

asts.apply = {};

asts.apply.options = {
    base: 'expr',
    props: 'Expr Mode Args'
};

asts.apply._getType = yate.value('xml');

asts.apply.w_validate = function() {
    var Expr = this.Expr;
    if ( !( Expr.getType('nodeset') || Expr.getType('object') || Expr.getType('array') ) ) {
        this.error('Type of expression should be NODESET');
    }
};

asts.apply.w_prepare = function() {
    var Expr = this.Expr;
    if (Expr.id === 'object' || Expr.id === 'array') {
        Expr.rid();
    }
};

asts.apply.closes = yate.false;

asts.apply.setAsList = function() {
    this.f.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  value
//  ---------------------------------------------------------------------------------------------------------------  //

asts.value = {};

asts.value.options = {
    props: 'Value'
};

asts.value._getType = function() {
    return this.Value.getType();
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

asts.value.isLocal = function() {
    return this.Value.isLocal();
};

asts.value.isConst = function() {
    return this.Value.isConst();
};

asts.value.setAsList = function() {
    this.f.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.subexpr = {};

asts.subexpr.options = {
    props: 'Block'
};

asts.subexpr._getType = function() {
    return this.Block.getType();
};

asts.subexpr.oncast = function(to) {
    this.Block.cast(to);
};

asts.subexpr.closes = function() {
    return this.Block.closes();
};

asts.subexpr.setPrevOpened = function(prevOpened) {
    this.Block.setPrevOpened(prevOpened);
};

asts.subexpr.setAsList = function() {
    this.f.AsList = true;
};

asts.subexpr.w_prepare = function() {
    if (this.f.AsList) {
        this.Block.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  attr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.attr = {};

asts.attr.options = {
    base: 'xml',
    props: 'Name Op Value'
};

asts.attr._getType = yate.value('attr');

asts.attr.w_setTypes = function() {
    this.Name.cast('scalar');
    if ( this.Value.getType() !== 'xml' ) {
        //  Приведение через cast не меняет на самом деле тип выражения.
        //  Так что в шаблонах по типу не понять, какой там тип.
        this.AttrType = 'scalar';
        this.Value.cast('scalar');
    } else {
        this.AttrType = 'xml';
        this.Value.cast('xml');
    }
};

asts.attr.w_prepare = function() {
    if ( !this.Value.inline() ) {
        this.Value.rid();
    }
};

asts.attr.closes = yate.false;


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_close = {};

asts.attrs_close._getType = yate.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_open = {};

asts.attrs_open.options = {
    props: 'Name Attrs'
};

asts.attrs_open._copy = function(ast) {
    this.Name = ast.Name;
    this.Attrs = ast.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.make('attrs_open', ...),
    //  но w_setTypes для xml_attr случает раньше этого.
    this.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    ast.Attrs = null;
};

asts.attrs_open._getType = yate.value('xml');





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



//  ---------------------------------------------------------------------------------------------------------------  //
//  arglist_item
//  ---------------------------------------------------------------------------------------------------------------  //

asts.arglist_item = {};

asts.arglist_item.options = {
    props: 'Typedef Name Default'
};

asts.arglist_item.w_action = function() {
    //  FIXME: Очень уж хрупкая конструкция.
    //  NOTE: Смысл в том, что в AST параметры и блок на одном уровне, а отдельный scope создается
    //  только для блока. И аргументы нужно прописывать именно туда.
    var blockScope = this.parent.parent.p.Body.p.Block.scope;
    var vars = blockScope.vars;

    var name = this.Name;
    if ( vars[name] ) {
        this.error('Повторное определение аргумента ' + name);
    }

    vars[name] = this;
    //  Заодно меняем и scope.
    this.scope = blockScope;

    this.Id = this.state.vid++;
};

asts.arglist_item.isConst = yate.false;

asts.arglist_item._getType = function() {
    var typedef = this.Typedef;
    switch (typedef) {
        case 'nodeset':
        case 'object':
        case 'array':
        case 'boolean':
        case 'xml':
            return typedef;

        default:
            return 'scalar';
    }
};

asts.arglist_item.w_prepare = function() {
    if (this.Default) {
        this.Default.cast( this.getType() );
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

asts.callargs.yatesep__ = ', ';

//  ---------------------------------------------------------------------------------------------------------------  //
//  callarg
//  ---------------------------------------------------------------------------------------------------------------  //

asts.callarg = {};

asts.callarg.options = {
    props: 'Expr'
};

asts.callarg._getType = function() {
    return this.Expr.getType();
};

asts.callarg.isLocal = function() {
    return this.Expr.isLocal();
};

asts.callarg.oncast = function(to) {
    this.Expr.cast(to);
};



//  ---------------------------------------------------------------------------------------------------------------  //

asts.pair = {};

asts.pair.options = {
    props: 'Key Value'
};

asts.pair._getType = yate.value('pair');

asts.pair.w_setTypes = function() {
    this.Key.cast('scalar');

    var type = this.Value.getType();
    if (type === 'nodeset') {
        this.Value.cast('data');
    } else {
        this.Value.cast(type);
    }
};

asts.pair.w_prepare = function() {
    var value = this.Value;

    if ( !value.inline() ) {
        value.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.object = {};

asts.object.options = {
    props: 'Block'
};

asts.object._getType = yate.value('object');

asts.object.w_setTypes = function() {
    this.Block.cast('pair');
};

asts.object.setAsList = function() {
    this.f.AsList = true;
};

asts.object.w_prepare = function() {
    if (this.f.AsList) {
        this.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.array = {};

asts.array.options = {
    props: 'Block'
};

asts.array._getType = yate.value('array');

asts.array.w_list = function() {
    this.Block.setAsList();
};

asts.array.setAsList = function() {
    this.f.AsList = true;
};

asts.array.w_prepare = function() {
    if (this.f.AsList) {
        this.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.cdata = {};

asts.cdata.options = {
    props: 'Value'
};

asts.cdata._getType = yate.value('xml');

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

asts.inline_expr.inline = yate.true;

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
        return this.make('cast', {
            From: this.getType(),
            To: AsType,
            Expr: this
        });
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op'
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
    base: 'inline_op',
    props: 'Left Op'
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
    base: 'inline_op',
    props: 'Left Op Right'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_number
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_number = {};

asts.inline_number.options = {
    base: 'inline_expr',
    props: 'Value'
};

asts.inline_number.isLocal = yate.false;

asts.inline_number.isConst = yate.true;

asts.inline_number._getType = yate.value('scalar');


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_string = {};

asts.inline_string.options = {
    base: 'inline_expr',
    props: 'Value'
};

asts.inline_string._getType = yate.value('scalar');

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

asts.string_content._getType = yate.value('scalar');

asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_expr = {};

asts.string_expr.options = {
    base: 'inline_expr',
    props: 'Expr'
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
    base: 'inline_expr',
    props: 'Value'
};

var entities = require('./entities.json');

function deentitify(s) {
    return s
        .replace(/&#(\d+);?/g, function (_, code) {
            return String.fromCharCode(code);
        })
        .replace(/&#[xX]([A-Fa-f0-9]+);?/g, function (_, hex) {
            return String.fromCharCode( parseInt(hex, 16) );
        })
        .replace(/&(\w+);/g, function (entity, name) {
            return entities[name] || entity;
        });
}

asts.string_literal.w_action = function() {
    this.Value = deentitify(this.Value);
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
asts.string_literal.yate = function() {
    return this.Value;
};

asts.string_literal._getType = yate.value('scalar');

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

asts.string_literal.isConst = yate.true;

asts.string_literal.isLocal = yate.false;


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

asts.inline_var.isLocal = yate.false;

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
                Name: name,
                Signatures: (params instanceof Array) ? params : [ params ]
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

asts.inline_internal_function._copy = function(ast) {
    this.Name = ast.Name;
    var signatures = this.Signatures = ast.signatures;

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

//  ---------------------------------------------------------------------------------------------------------------  //
//  cast
//  ---------------------------------------------------------------------------------------------------------------  //

asts.cast = {};

asts.cast.options = {
    base: 'inline_expr',
    props: 'From To Expr'
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

asts.sort._getType = yate.value('nodeset');

asts.sort.w_validate = function() {
    if (this.Nodes.getType() !== 'nodeset') {
        this.Nodes.error('Type should be nodeset.');
    }
};

asts.sort.w_prepare = function() {
    this.By.cast('scalar');
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
    base: 'inline_expr',
    props: 'Abs Context Steps'
};

asts.jpath._getType = yate.value('nodeset');

asts.jpath.isLocal = function() {
    return !this.Abs;
};

asts.jpath.w_action = function() {
    if ( this.isSimple() ) {
        this.f.IsSimple = true;
        this.Name = this.Steps.first().p.Name;
    }
};

asts.jpath.isSimple = function() {
    var steps = this.Steps;
    return ( steps.length() === 1 && steps.first().is('jpath_nametest') );
};

asts.jpath.isRoot = function() {
    return this.Abs && this.Steps.empty();
};

asts.jpath.w_validate = function() {
    var context = this.Context;
    if ( context && !context.getType('nodeset') ) {
        context.error('Invalid type. Should be NODESET');
    }
};

asts.jpath.validateMatch = function() {
    var steps = this.Steps.p;
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
    var steps = this.Steps.p.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if ( step.is('jpath_nametest') ) {
            return step.p.Name;
        }
    }
    return '';
};

asts.jpath.getScope = function() {
    return this.Steps.getScope();
};

asts.jpath.w_extractDefs = function() {
    //  Каноническая запись jpath.
    var key = this.yate();

    var state = this.state;
    //  scope, в котором этот jpath имеет смысл.
    //  Например, .foo.bar[ .count > a + b ] имеет смысл только внутри scope'а,
    //  в котором определены переменные a и b.
    var scope = this.getScope();

    //  Если этот jpath еще не хранится в scope, то добаляем его туда.
    var jid = scope.jkeys[key];
    if (jid === undefined) {
        jid = scope.jkeys[key] = state.jid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.Id = jid;
    this.Key = key;
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

asts.jpath_dots.options = {
    props: 'Dots'
};

asts.jpath_dots.w_action = function() {
    this.Length = this.Dots.length - 1;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_predicate
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_predicate = {};

asts.jpath_predicate.options = {
    props: 'Expr'
};

asts.jpath_predicate.getScope = function() {
    if ( this.isLocal() ) {
        return this.Expr.getScope();
    } else {
        //  FIXME: Временный костыль. Выражение .item[ /.index ] должно быть индексом,
        //  но из-за того, что оно глобальное, оно уезжает в глобальный scope.
        //  А индексы у меня сейчас не предусмотрены глобальные, т.к. там выражение
        //  явно генерится, без функциональной обертки.
        return this.scope;
    }
};

asts.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

asts.jpath_predicate.isMatchable = function() {
    return this.Expr.isLocal() || this.Expr.getType() === 'boolean';
};

asts.jpath_predicate.w_setTypes = function() {
    if (this.isLocal() || this.Expr.getType() === 'boolean') {
        //  .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast('boolean');
    } else {
        //  .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast('scalar');
    }
};

asts.jpath_predicate.w_extractDefs = function() {
    //  Каноническая запись предиката.
    var key = this.Expr.yate();

    var state = this.state;
    //  См. примечание в jpath.action().
    var scope = this.getScope();

    //  Если этот predicate еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.Id = pid;
    this.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_filter
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_filter = {};

asts.jpath_filter.options = {
    base: 'inline_expr',
    props: 'Expr JPath'
};

asts.jpath_filter._getType = yate.value('nodeset');

asts.jpath_filter.isLocal = function() {
    return this.Expr.isLocal() || this.JPath.isLocal();
};

asts.jpath_filter.getScope = function() {
    return yate.Scope.commonScope( this.Expr.getScope(), this.JPath.getScope() );
};

asts.jpath_filter.w_prepare = function() {
    this.Expr.cast('nodeset');
};

asts.jpath_filter.w_validate = function() {
    if ( !this.Expr.getType('nodeset') ) {
        this.Expr.error('Type should be NODESET');
    }
};


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  simple_jpath
//  ---------------------------------------------------------------------------------------------------------------  //

asts.simple_jpath = {};

asts.simple_jpath.options = {
    base: 'inline_expr',
    props: 'Name JPath'
};

asts.simple_jpath._getType = yate.value('nodeset');

asts.simple_jpath._copy = function(ast) {
    //  FIXME: А зачем тут хранится ссылка на jpath?
    this.JPath = ast.JPath;
    this.Name = this.JPath.Steps.first().Name;
};

asts.simple_jpath.isLocal = function() {
    return this.JPath.isLocal();
};

asts.simple_jpath.getScope = function() {
    return this.JPath.getScope();
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//
//  xml:
//
//    * xmw
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

asts.xml._getType = yate.value('xml');


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
                //  FIXME: Если p.Name === true, будет не очень внятное сообщение об ошибке.
                that.error('Закрывающий тег </' + item.p.Name + '> не был предварительно открыт');
            } else if ( (item.p.Name !== name) && (item.p.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            //  FIXME: Не очень подходящее место для этого действия.
            //  Лучше бы унести это в какой-то .action().
            item.p.Name = name;
        }
    });
};

asts.xml_line.opens = function() {
    return !!this.lastTag();
};

asts.xml_line.lastTag = function() {
    var last = this.last();
    if ( last.is('xml_start') ) {
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
            r[i] = JSON.stringify(item);
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
    base: 'xml',
    props: 'Name Attrs'
};

asts.xml_start.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push( (yate.consts.shortTags[name]) ? '/>' : '>' );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_end
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_end = {};

asts.xml_end.options = {
    base: 'xml',
    props: 'Name'
};

asts.xml_end.w_action = function() {
    if ( yate.consts.shortTags[this.Name] ) {
        this.f.Short = true;
    }
};

asts.xml_end.toResult = function(result) {
    if (!this.f.Short) {
        result.push('</' + this.Name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_empty
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_empty = {};

asts.xml_empty.options = {
    base: 'xml',
    props: 'Name Attrs'
};

asts.xml_empty.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    this.Attrs.toResult(result);
    if ( yate.consts.shortTags[name] ) {
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
    base: 'xml',
    props: 'Text'
};

asts.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

asts.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_full
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_full = {};

asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};
*/

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

asts.xml_attr.options = {
    props: 'Name Value'
};

asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.Name + '="');
    this.Value.toResult(result);
    result.push('"');
};

asts.xml_attr.w_prepare = function() {
    //  FIXME: Как бы не ходить по дереву так уродливо?
    //  Ответ: Сделать это в attrs_open?
    if ( !this.parent.parent.is('attrs_open') ) {
        this.Value.cast('attrvalue');
    } else {
        this.Value.cast('scalar');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = asts;

//  ---------------------------------------------------------------------------------------------------------------  //


