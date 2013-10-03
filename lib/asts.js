var pt = require('parse-tools');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./types.js');
require('./scope.js');
require('./consts.js');
require('./ast.js');

var entities = require('./entities.json');

var no = require('nommon');

var yr = require('./runtime.js');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

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

//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items._init = function(items) {
    this.p.Items = items || [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.add = function(item) {
    this.p.Items.push(item);
};

yate.asts.items.length = function() {
    return this.p.Items.length;
};

yate.asts.items.first = function() {
    return this.p.Items[0];
};

yate.asts.items.last = function() {
    var items = this.p.Items;
    return items[items.length - 1];
};

yate.asts.items.empty = function() {
    return (this.p.Items.length === 0);
};

yate.asts.items.iterate = function(callback) {
    this.p.Items.forEach(callback);
};

yate.asts.items.iterateBack = function(callback) {
    this.p.Items.reverse().forEach(callback);
};

yate.asts.items.grep = function(callback) {
    return this.p.Items.filter(callback);
};

yate.asts.items.map = function(callback) {
    return this.p.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.code = function(lang, mode) {
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

yate.asts.items.toString = function() {
    if (this.p.Items.length > 0) {
        var r = this.p.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

/*
yate.asts.items.toJSON = function() {
    return this.map(function(item) {
        return item.toJSON();
    });
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
yate.asts.items.someIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.allIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.noneIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.apply = function(callback, params) {
    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], params);
    }
};

yate.asts.items.walkdo = function(callback, params, pKey, pObject) {
    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

yate.asts.items.dowalk = function(callback, params) {
    callback(this, params);

    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

yate.asts.items.mergeWith = function(ast) {
    this.p.Items = ast.p.Items.concat(this.p.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items._getType = function() {
    var items = this.p.Items;
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

yate.asts.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.isLocal = function() {
    return this.someIs('isLocal');
};

yate.asts.items.isConst = function() {
    return this.allIs('isConst');
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.getScope = function() {
    var items = this.p.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};



//  ---------------------------------------------------------------------------------------------------------------  //
//  module
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.module = {};

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

yate.asts.body = {};

yate.asts.body._getType = function() {
    return this.p.Block.getType();
};

yate.asts.body.closes = function() {
    return this.p.Block.closes();
};

yate.asts.body.oncast = function(to) {
    this.p.Block.cast(to);
};

yate.asts.body.setPrevOpened = function(prevOpened) {
    this.p.Block.setPrevOpened(prevOpened);
};

yate.asts.body.isLocal = function() {
    return this.p.Block.isLocal();
};

yate.asts.body.inline = function() {
    return this.p.Block.inline();
};

yate.asts.body.setAsList = function() {
    this.f.AsList = true;
    this.p.Block.setAsList();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  block
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block = {};

yate.asts.block.options = {
    scope: true
};

yate.asts.block._init = function() {
    var p = this.p;

    //  Хранилище всего содержимого блока. Заполняется при парсинге.
    p.Items = this.make('block_items');

    //  После парсинга все элементы блока раскладываются на отдельные кучки.
    //  p.Includes = this.make('block_includes');
    //  p.Imports = this.make('block_imports');
    p.Defs = this.make('block_defs');
    p.Templates = this.make('block_templates');
    p.Exprs = this.make('block_exprs');
};

yate.asts.block._getType = function() {
    return this.p.Exprs.getType();
};

yate.asts.block.w_setTypes = function() {
    if (this.f.AsList) {
        this.p.Exprs.iterate(function(item) {
            if (item.getType() === 'nodeset') {
                item.cast('scalar');
            } else {
                item.cast();
            }
        });
    }
};

yate.asts.block.w_deinclude = function() {
    var a = [];

    this.p.Items.iterate(function(item) {
        if (item.id === 'include') {
            var ast = yate.parse(item.p.Filename, 'module');
            ast.dowalk(function(ast) {
                ast.w_deinclude();
            });
            a = a.concat(ast.p.Block.p.Items.p.Items);
        } else {
            a.push(item);
        }
    });

    this.p.Items.p.Items = a;
};

yate.asts.block.w_deimport = function() {
    var a = [];
    var imports = [];

    this.p.Items.iterate(function(item) {
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

    this.p.Items.p.Items = a;
    this.p.Imports = JSON.stringify(imports);
};

yate.asts.block.w_deitemize = function() {
    var Defs = this.p.Defs;
    var Templates = this.p.Templates;
    var Exprs = this.p.Exprs;

    //  FIXME: Без этой проверки каким-то образом этот код вызывается повторно.
    if (this.p.Items) {
        this.p.Items.iterate(function(item) {
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

        this.p.Items = null;
    }
};

yate.asts.block.oncast = function(to) {
    this.p.Exprs.cast(to);
};

yate.asts.block.closes = function() {
    //  FIXME: Может таки унести это в block_exprs.closes?
    var exprs = this.p.Exprs;
    if ( exprs.empty() ) { return false; }

    return exprs.first().closes();
};

yate.asts.block.setPrevOpened = function(prevOpened) {
    this.prevOpened = prevOpened;
};

yate.asts.block.mergeWith = function(block) {
    this.p.Imports.mergeWith(block.p.Imports);
    this.p.Defs.mergeWith(block.p.Defs);
    this.p.Templates.mergeWith(block.p.Templates);
    this.p.Exprs.mergeWith(block.p.Exprs);
};

yate.asts.block.isLocal = function() {
    return this.p.Exprs.isLocal();
};

yate.asts.block.inline = function() {
    return (
        this.p.Templates.empty() &&
        !this.scope.defs.length &&
        this.p.Exprs.length() === 1 &&
        this.p.Exprs.first().inline()
    );
};

yate.asts.block.js__matcher = function() {
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

yate.asts.block.js__defs = function() {
    var defs = this.scope.defs;
    var r = [];
    for (var i = 0, l = defs.length; i < l; i++) {
        r.push( defs[i].js('defs') );
    }
    return r.join('\n\n');
};

yate.asts.block.setAsList = function() {
    this.f.AsList = true;
    this.p.Exprs.iterate(function(item) {
        item.setAsList();
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  block_items
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block_items = {};

yate.asts.block_items.options = {
    mixin: 'items'
};

yate.asts.block_items.yatesep__ = '\n';

/*
//  FIXME: Сделать инденты при выводе.
yate.asts.block_items.yate__ = function() {
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
yate.asts.block_imports = {};

yate.asts.block_imports.options = {
    mixin: 'items'
};

yate.asts.block_imports.jssep__ = ', ';
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  block_includes
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block_includes = {};

yate.asts.block_includes.options = {
    mixin: 'items'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_defs
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block_defs = {};

yate.asts.block_defs.options = {
    mixin: 'items'
};

yate.asts.block_defs.jssep__global_def = '\n';

yate.asts.block_defs.yatesep__ = '\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_templates
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block_templates = {};

yate.asts.block_templates.options = {
    mixin: 'items'
};

yate.asts.block_templates.jssep__ = '\n\n';

yate.asts.block_templates.jssep__defs = '\n\n';

yate.asts.block_templates.yatesep__ = '\n\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  block_exprs
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block_exprs = {};

yate.asts.block_exprs.options = {
    mixin: 'items'
};

yate.asts.block_exprs.w_validate = function() {
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

yate.asts.block_exprs.w_prepare = function() {
    if ( this.parent.f.AsList ) { return; }
    if ( this.getType() !== 'xml' && this.p.AsType !== 'xml' ) { return; }

    var items = this.p.Items;
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

    this.p.Items = o;
};

yate.asts.block_exprs.jssep__output = '\n';

yate.asts.block_exprs.jssep__listitem = '\n';

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

yate.asts.template = {};

yate.asts.template.w_action = function() {
    this.p.Id = this.state.tid++;
};

yate.asts.template.w_setTypes = function() {
    this.p.Body.cast( this.getType() );
};

yate.asts.template._getType = function() {
    var type = this.p.Body.getType();
    if (type == 'array' || type == 'object') {
        return type;
    }
    return 'xml';
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  template_selectors
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.template_selectors = {};

yate.asts.template_selectors.options = {
    mixin: 'items'
};

yate.asts.template_selectors.getLastSteps = function() {
    var steps = [];
    this.iterate(function(selector) {
        var step = ( selector.isRoot() ) ? '' : selector.lastName();
        if (steps.indexOf(step) === -1) {
            steps.push(step);
        }
    });
    return steps;
};

yate.asts.template_selectors.w_validate = function() {
    this.iterate(function(selector) {
        selector.validateMatch();
    });
};

yate.asts.template_selectors.jssep__template_selector = ', ';
yate.asts.template_selectors.jssep__template_abs = ', ';

yate.asts.template_selectors.yatesep__ = ' | ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  template_mode
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.template_mode = {};


//  ---------------------------------------------------------------------------------------------------------------  //
//  var_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.var_ = {};

yate.asts.var_.w_action = function() {
    var vars = this.scope.vars;
    var name = this.p.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    if (this.p.Id === undefined) {
        this.p.Id = this.state.vid++;
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

yate.asts.var_._getType = function() {
    return this.p.Value.getType();
};

yate.asts.var_.w_setTypes = function() {
    this.p.Value.cast();
};

yate.asts.var_.w_prepare = function() {
    var Value = this.p.Value;
    //  Выставляем значению переменной специальный флаг.
    if ( Value.inline() ) {
        if (Value.getType() === 'attr') {
            Value.p.Value.f.InlineVarValue = true;
        }
    } else {
        Value.rid();
    }
};

yate.asts.var_.w_extractDefs = function() {
    this.scope.defs.push(this);
};

yate.asts.var_.isConst = function() {
    return this.p.Value.isConst();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  function_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.function_ = {};

yate.asts.function_.w_action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    if (this.p.Id === undefined) {
        this.p.Id = this.state.fid++;
    }
    this.f.IsUser = true;

    functions[name] = this;
};

yate.asts.function_.w_validate = function() {
    if (this.p.Body.getType() === 'undef') {
        this.error('Undefined type of return value');
    }
};

yate.asts.function_._getType = function() {
    return this.p.Body.getType();
};

yate.asts.function_.w_setTypes = function() {
    this.p.Body.cast();
};

yate.asts.function_.w_extractDefs = function() {
    this.scope.defs.push(this);
};

yate.asts.function_.isLocal = function() {
    return this.p.Body.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  key
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.key = {};

yate.asts.key.w_action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    if (this.p.Id === undefined) {
        this.p.Id = this.state.kid++;
    }
    this.f.IsKey = true;

    functions[name] = this;
};

yate.asts.key.w_validate = function() {
    if ( !this.p.Nodes.getType('nodeset') ) {
        this.p.Nodes.error('Nodeset is required');
    }
    var useType = this.p.Use.getType();
    if (useType !== 'scalar' && useType !== 'nodeset') {
        this.p.Use.error('Scalar or nodeset is required');
    }
};

yate.asts.key._getType = function() {
    return this.p.Body.getType();
};

yate.asts.key.w_prepare = function() {
    //  Если в Nodes объект, то его бы неплохо привести к nodeset.
    this.p.Nodes.cast('nodeset');
    if (this.p.Use.getType() !== 'nodeset') {
        this.p.Use.cast('scalar');
    }
    this.p.Body.cast();
};

yate.asts.key.w_extractDefs = function() {
    this.scope.defs.push(this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  external
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.external = {};

yate.asts.external.w_action = function() {
    var functions = this.scope.functions;
    var name = this.p.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.f.IsExternal = true;

    functions[name] = this;
};

yate.asts.external._getType = function() {
    return this.p.Type;
};

yate.asts.external.w_extractDefs = function() {
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

yate.asts.if_ = {};

yate.asts.if_.options = {
    base: 'expr'
};

yate.asts.if_._init = function() {
    this.p.Elses = this.make('elses');
};

yate.asts.if_._getType = function() {
    var type = this.p.Then.getType();
    this.p.Elses.iterate(function(item) {
        type = yate.types.commonType( type, item.getType() );
    });
    return type;
};

yate.asts.if_.w_setTypes = function() {
    this.p.Condition.cast('boolean');
    this.p.Elses.iterate(function(item) {
        if ( item.is('else_if') ) {
            item.p.Condition.cast('boolean');
        }
    });
};

yate.asts.if_.oncast = function(to) {
    this.p.Then.cast(to);
    this.p.Elses.iterate(function(item) {
        item.p.Body.cast(to);
    });
};

yate.asts.if_.closes = function() {
    return this.p.Then.closes() && this.p.Elses.allIs('closes');
};

yate.asts.if_.setPrevOpened = function(prevOpened) {
    this.p.Then.setPrevOpened(prevOpened);
    this.p.Elses.iterate(function(item) {
        item.p.Body.setPrevOpened(prevOpened);
    });
};

yate.asts.if_.isLocal = function() {
    return this.p.Then.isLocal() || this.p.Elses.isLocal();
};

yate.asts.if_.setAsList = function() {
    this.f.AsList = true;
    this.p.Then.setAsList();
    this.p.Elses.iterate(function(item) {
        item.setAsList();
    });
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  elses
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.elses = {};

yate.asts.elses.options = {
    mixin: 'items'
};

yate.asts.elses.jssep__ = ' ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_if
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.else_if = {};

yate.asts.else_if._getType = function() {
    return this.p.Body.getType();
};

yate.asts.else_if.closes = function() {
    return this.p.Body.closes();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.else_ = {};

yate.asts.else_._getType = function() {
    return this.p.Body.getType();
};

yate.asts.else_.closes = function() {
    return this.p.Body.closes();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  for_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.for_ = {};

yate.asts.for_.options = {
    base: 'expr'
};

yate.asts.for_._getType = function() {
    var type = this.p.Body.getType();

    if (this.f.AsList) {
        return type;
    }

    return yate.types.joinType(type, type);
};

yate.asts.for_.oncast = function(to) {
    this.p.Body.cast(to);
};

yate.asts.for_.w_prepare = function() {
    this.p.Body.cid();
};

yate.asts.for_.closes = function() {
    return this.p.Body.closes();
};

yate.asts.for_.setPrevOpened = function(prevOpened) {
    this.p.Body.setPrevOpened(prevOpened);
};

yate.asts.for_.isLocal = function() {
    return this.p.Body.isLocal();
};

yate.asts.for_.setAsList = function() {
    this.f.AsList = true;
    this.p.Body.setAsList();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  apply
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.apply = {};

yate.asts.apply.options = {
    base: 'expr'
};

yate.asts.apply._getType = no.value('xml');

yate.asts.apply.w_validate = function() {
    var Expr = this.p.Expr;
    if ( !( Expr.getType('nodeset') || Expr.getType('object') || Expr.getType('array') ) ) {
        this.error('Type of expression should be NODESET');
    }
};

yate.asts.apply.w_prepare = function() {
    var Expr = this.p.Expr;
    if (Expr.id === 'object' || Expr.id === 'array') {
        Expr.rid();
    }
};

yate.asts.apply.closes = no.false;

yate.asts.apply.setAsList = function() {
    this.f.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  value
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.value = {};

yate.asts.value._getType = function() {
    return this.p.Value.getType();
};

yate.asts.value.oncast = function(to) {
    this.p.Value.cast(to);
};

yate.asts.value.inline = function() {
    return this.p.Value.inline();
};

yate.asts.value.closes = function() {
    return this.p.Value.closes();
};

yate.asts.value.isLocal = function() {
    return this.p.Value.isLocal();
};

yate.asts.value.isConst = function() {
    return this.p.Value.isConst();
};

yate.asts.value.setAsList = function() {
    this.f.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.subexpr = {};

yate.asts.subexpr._getType = function() {
    return this.p.Block.getType();
};

yate.asts.subexpr.oncast = function(to) {
    this.p.Block.cast(to);
};

yate.asts.subexpr.closes = function() {
    return this.p.Block.closes();
};

yate.asts.subexpr.setPrevOpened = function(prevOpened) {
    this.p.Block.setPrevOpened(prevOpened);
};

yate.asts.subexpr.setAsList = function() {
    this.f.AsList = true;
};

yate.asts.subexpr.w_prepare = function() {
    if (this.f.AsList) {
        this.p.Block.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  attr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attr = {};

yate.asts.attr.options = {
    base: 'xml'
};

yate.asts.attr._getType = no.value('attr');

yate.asts.attr.w_setTypes = function() {
    this.p.Name.cast('scalar');
    if ( this.p.Value.getType() !== 'xml' ) {
        //  Приведение через cast не меняет на самом деле тип выражения.
        //  Так что в шаблонах по типу не понять, какой там тип.
        this.p.AttrType = 'scalar';
        this.p.Value.cast('scalar');
    } else {
        this.p.AttrType = 'xml';
        this.p.Value.cast('xml');
    }
};

yate.asts.attr.w_prepare = function() {
    if ( !this.p.Value.inline() ) {
        this.p.Value.rid();
    }
};

yate.asts.attr.closes = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attrs_close = {};

yate.asts.attrs_close._getType = no.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attrs_open = {};

yate.asts.attrs_open._init = function(item) {
    this.p.Name = item.p.Name;
    this.p.Attrs = item.p.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.make('attrs_open', ...),
    //  но w_setTypes для xml_attr случает раньше этого.
    this.p.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    item.p.Attrs = null;
};

yate.asts.attrs_open._getType = no.value('xml');



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

yate.asts.xml = {};

yate.asts.xml.options = {
    base: 'expr'
};

yate.asts.xml._getType = no.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_line
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_line = {};

yate.asts.xml_line.options = {
    base: 'xml',
    mixin: 'items'
};

yate.asts.xml_line.wellFormed = function(opened) {
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

yate.asts.xml_line.opens = function() {
    return !!this.lastTag();
};

yate.asts.xml_line.lastTag = function() {
    var last = this.last();
    if ( last.is('xml_start') ) {
        return last;
    }
};

yate.asts.xml_line.js__content = function() {
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

yate.asts.xml_start = {};

yate.asts.xml_start.options = {
    base: 'xml'
};

yate.asts.xml_start.toResult = function(result) {
    var name = this.p.Name;

    result.push('<' + name);
    if (!this.open) {
        this.p.Attrs.toResult(result);
        result.push( (yate.consts.shortTags[name]) ? '/>' : '>' );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_end
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_end = {};

yate.asts.xml_end.options = {
    base: 'xml'
};

yate.asts.xml_end.w_action = function() {
    if ( yate.consts.shortTags[this.p.Name] ) {
        this.f.Short = true;
    }
};

yate.asts.xml_end.toResult = function(result) {
    if (!this.f.Short) {
        result.push('</' + this.p.Name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_empty
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_empty = {};

yate.asts.xml_empty.options = {
    base: 'xml'
};

yate.asts.xml_empty.toResult = function(result) {
    var name = this.p.Name;

    result.push('<' + name);
    this.p.Attrs.toResult(result);
    if ( yate.consts.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_text
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_text = {};

yate.asts.xml_text.options = {
    base: 'xml'
};

yate.asts.xml_text.oncast = function(to) {
    this.p.Text.cast(to);
};

yate.asts.xml_text.toResult = function(result) {
    this.p.Text.toResult(result);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_full
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_full = {};

yate.asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attrs
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_attrs = {};

yate.asts.xml_attrs.options = {
    mixin: 'items'
};

yate.asts.xml_attrs.jssep__open = ',\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_attr = {};

yate.asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.p.Name + '="');
    this.p.Value.toResult(result);
    result.push('"');
};

yate.asts.xml_attr.w_prepare = function() {
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

yate.asts.inline_expr = {};

yate.asts.inline_expr.options = {
    base: 'expr'
};

yate.asts.inline_expr.toResult = function(result) {
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

yate.asts.inline_expr.inline = no.true;

yate.asts.inline_expr.closes = function() {
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

yate.asts.inline_expr.w_transform = function() {
    var AsType = this.p.AsType;

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

yate.asts.inline_op = {};

yate.asts.inline_op.options = {
    base: 'inline_expr'
};

yate.asts.inline_op.w_setTypes = function() {
    var signature = this.signature;
    if (signature) {
        this.p.Left.cast(signature.left);
        if (this.p.Right) {
            this.p.Right.cast(signature.right);
        }
    }
};

yate.asts.inline_op.isLocal = function() {
    return this.p.Left.isLocal() || ( this.p.Right && this.p.Right.isLocal() );
};

yate.asts.inline_op._getType = function() {
    return this.signature.result;
};

yate.asts.inline_op.getScope = function() {
    var lscope = this.p.Left.getScope();
    if (this.p.Right) {
        var rscope = this.p.Right.getScope();
        return yate.Scope.commonScope(lscope, rscope);
    } else {
        return lscope;
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_or
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_or = {};

yate.asts.inline_or.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

yate.asts.inline_or.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_and
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_and = {};

yate.asts.inline_and.signature = {
    left: 'boolean',
    right: 'boolean',
    result: 'boolean'
};

yate.asts.inline_and.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_eq
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_eq = {};

yate.asts.inline_eq.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

yate.asts.inline_eq.options = {
    base: 'inline_op'
};

yate.asts.inline_eq.w_setTypes = function() {
    var Left = this.p.Left;
    var Right = this.p.Right;

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

yate.asts.inline_rel = {};

yate.asts.inline_rel.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

yate.asts.inline_rel.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_add
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_add = {};

yate.asts.inline_add.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

yate.asts.inline_add.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_mul
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_mul = {};

yate.asts.inline_mul.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'scalar'
};

yate.asts.inline_mul.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_unary
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_unary = {};

yate.asts.inline_unary.signature = {
    left: 'scalar',
    result: 'scalar'
};

yate.asts.inline_unary.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_not
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_not = {};

yate.asts.inline_not.signature = {
    left: 'boolean',
    result: 'boolean'
};

yate.asts.inline_not.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_union
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_union = {};

yate.asts.inline_union.signature = {
    left: 'nodeset',
    right: 'nodeset',
    result: 'nodeset'
};

yate.asts.inline_union.options = {
    base: 'inline_op'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_number
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_number = {};

yate.asts.inline_number.options = {
    base: 'inline_expr'
};

yate.asts.inline_number.isLocal = no.false;

yate.asts.inline_number.isConst = no.true;

yate.asts.inline_number._getType = no.value('scalar');


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_string = {};

yate.asts.inline_string.options = {
    base: 'inline_expr'
};

yate.asts.inline_string._getType = no.value('scalar');

yate.asts.inline_string.oncast = function(to) {
    this.p.Value.cast(to);

    //  FIXME: WTF?
    return false;
};

yate.asts.inline_string.toResult = function(result) {
    this.p.Value.toResult(result);
};

yate.asts.inline_string.asString = function() {
    var s = '';

    this.p.Value.iterate(function(item) {
        s += item.asString();
    });

    return s;
};

yate.asts.inline_string.isConst = function() {
    return this.p.Value.isConst();
};

yate.asts.inline_string.isLocal = function() {
    return this.p.Value.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_content
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_content = {};

yate.asts.string_content.options = {
    mixin: 'items'
};

yate.asts.string_content._getType = no.value('scalar');

yate.asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_expr = {};

yate.asts.string_expr.options = {
    base: 'inline_expr'
};

yate.asts.string_expr._init = function(expr) {
    this.p.Expr = expr;
};

yate.asts.string_expr._getType = function() {
    return this.p.Expr.getType();
};

yate.asts.string_expr.isLocal = function() {
    return this.p.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_literal
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_literal = {};

yate.asts.string_literal.w_action = function() {
    this.p.Value = deentitify(this.p.Value);
};

yate.asts.string_literal.options = {
    base: 'inline_expr'
};

yate.asts.string_literal._init = function(s) {
    this.p.Value = s;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
yate.asts.string_literal.yate = function() {
    return this.p.Value;
};

yate.asts.string_literal._getType = no.value('scalar');

yate.asts.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.p.Value = yr.text2attr(this.p.Value);
    } else if (to === 'xml') {
        this.p.Value = yr.text2xml(this.p.Value);
    }

    return false;
};

yate.asts.string_literal.stringify = function() {
    return JSON.stringify(this.p.Value);
};

yate.asts.string_literal.asString = function() {
    return this.p.Value;
};

yate.asts.string_literal.isConst = no.true;

yate.asts.string_literal.isLocal = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_subexpr = {};

yate.asts.inline_subexpr.options = {
    base: 'inline_expr'
};

yate.asts.inline_subexpr.isLocal = function() {
    return this.p.Expr.isLocal();
};

yate.asts.inline_subexpr._getType = function() {
    return this.p.Expr.getType();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_var
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_var = {};

yate.asts.inline_var.options = {
    base: 'inline_expr'
};

yate.asts.inline_var.w_action = function() {
    var def = this.def = this.scope.findVar(this.p.Name);
    if (!def) {
        this.error('Undefined variable ' + this.p.Name);
    }

    this.p.Id = def.p.Id;
};

yate.asts.inline_var._getType = function() {
    return this.def.getType();
};

yate.asts.inline_var.isLocal = no.false;

yate.asts.inline_var.getScope = function() {
    // return this.def.scope; // FIXME: В этот момент метод action еще не отработал, видимо, нужно action выполнять снизу-вверх.
    return this.scope.findVar(this.p.Name).scope;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_function
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_function = {};

yate.asts.inline_function.options = {
    base: 'inline_expr'
};

yate.asts.inline_function._getType = function() {
    var def = this.def;
    if (def.f.IsInternal) {
        return this.signature.type;
    }

    return def.getType();
};

yate.asts.inline_function.w_action = function() {
    var name = this.p.Name;

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
        this.p.Id = def.p.Id;
        this.f.IsUser = true;
    } else if (def.f.IsKey) {
        this.p.Id = def.p.Id;
        this.f.IsKey = true;
    } else {
        this.signature = def.findSignature(this.p.Args.p.Items);
        if (!this.signature) {
            this.error('Cannot find signature for this arguments');
        }
    }
};

yate.asts.inline_function.w_prepare = function() {
    var def = this.def;
    var args = this.p.Args;

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

yate.asts.inline_function.getScope = function() {
    //  Если в предикате используется вызов функции,
    //  то определение этого jpath'а нужно выводить в этом же scope.
    //  См. ../tests/functions.18.yate
    return this.scope;
};

yate.asts.inline_function.isLocal = function() {
    if (this.def.f.IsInternal) {
        if (this.signature.local) {
            return true;
        }

        return this.p.Args.someIs('isLocal');
        /*
        var args = this.p.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].isLocal() ) { return true; }
        }
        return false;
        */
    }

    if (this.f.IsExternal || this.f.IsKey) {
        return this.p.Args.someIs('isLocal');
        /*
        var args = this.p.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].isLocal() ) { return true; }
        }
        return false;
        */
    }

    return this.def.isLocal();
};

yate.asts.inline_function.js__internal = function() {
    var signature = this.signature;
    this.p.Signature = signature.args.join(',');
    return yate.AST.js.generate('internal_function_' + this.p.Name, this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_internal_function
//  ---------------------------------------------------------------------------------------------------------------  //

//  Сюда будем складывать инстансы inline_internal_function.
//  Определения для них лежат в consts.js, а создаются они в inline_function.action.
var internalFunctions = {};

yate.asts.inline_internal_function = {};

yate.asts.inline_internal_function._init = function(params) {
    this.p.Name = params.name;
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

yate.asts.inline_internal_function.findSignature = function(callargs) {
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

yate.asts.quote = {};

yate.asts.quote.options = {
    base: 'inline_expr'
};

yate.asts.quote._init = function(params) {
    this.p.Expr = params.expr;
    this.p.Mode = params.mode;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  cast
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.cast = {};

yate.asts.cast.options = {
    base: 'inline_expr'
};

yate.asts.cast._init = function(params) {
    var to = params.to;
    var expr = params.expr;

    this.p.From = expr.getType();
    this.p.To = to;
    this.p.Expr = expr;
    this.mode = expr.mode;
};

yate.asts.cast._getType = function() {
    return this.p.To;
};

yate.asts.cast.isLocal = function() {
    return this.p.Expr.isLocal();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  sort
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.sort = {};

yate.asts.sort.options = {
    base: 'inline_expr'
};

yate.asts.sort._getType = no.value('nodeset');

yate.asts.sort.w_validate = function() {
    if (this.p.Nodes.getType() !== 'nodeset') {
        this.p.Nodes.error('Type should be nodeset.');
    }
};

yate.asts.sort.w_prepare = function() {
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

yate.asts.jpath = {};

yate.asts.jpath.options = {
    base: 'inline_expr'
};

yate.asts.jpath._getType = no.value('nodeset');

yate.asts.jpath.isLocal = function() {
    return !this.p.Abs;
};

yate.asts.jpath.w_action = function() {
    if ( this.isSimple() ) {
        this.f.IsSimple = true;
        this.p.Name = this.p.Steps.first().p.Name;
    }
};

yate.asts.jpath.isSimple = function() {
    var steps = this.p.Steps;
    return ( steps.length() === 1 && steps.first().is('jpath_nametest') );
};

yate.asts.jpath.isSelf = function() {
    var steps = this.p.Steps;
    return !this.p.Abs && !steps.length;
};

yate.asts.jpath.isRoot = function() {
    return this.p.Abs && this.p.Steps.empty();
};

yate.asts.jpath.w_validate = function() {
    var context = this.p.Context;
    if ( context && !context.getType('nodeset') ) {
        context.error('Invalid type. Should be NODESET');
    }
};

yate.asts.jpath.validateMatch = function() {
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
yate.asts.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.p.Steps.p.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if ( step.is('jpath_nametest') ) {
            return step.p.Name;
        }
    }
    return '';
};

yate.asts.jpath.getScope = function() {
    return this.p.Steps.getScope();
};

yate.asts.jpath.w_extractDefs = function() {
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
    this.p.Id = jid;
    this.p.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_steps
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_steps = {};

yate.asts.jpath_steps.options = {
    mixin: 'items'
};

yate.asts.jpath_steps.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_dots
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_dots = {};

yate.asts.jpath_dots.w_action = function() {
    this.p.Length = this.p.Dots.length - 1;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_predicate
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_predicate = {};

yate.asts.jpath_predicate.getScope = function() {
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

yate.asts.jpath_predicate.isLocal = function() {
    return this.p.Expr.isLocal();
};

yate.asts.jpath_predicate.isMatchable = function() {
    return this.p.Expr.isLocal() || this.p.Expr.getType() === 'boolean';
};

yate.asts.jpath_predicate.w_setTypes = function() {
    if (this.isLocal() || this.p.Expr.getType() === 'boolean') {
        //  .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.p.Expr.cast('boolean');
    } else {
        //  .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.p.Expr.cast('scalar');
    }
};

yate.asts.jpath_predicate.w_extractDefs = function() {
    //  Каноническая запись предиката.
    var key = this.p.Expr.yate();

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
    this.p.Id = pid;
    this.p.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_filter
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_filter = {};

yate.asts.jpath_filter.options = {
    base: 'inline_expr'
};

yate.asts.jpath_filter._init = function(params) {
    if (params) {
        this.p.Expr = params.expr;
        this.p.JPath = params.jpath;
    }
};

yate.asts.jpath_filter._getType = no.value('nodeset');

yate.asts.jpath_filter.isLocal = function() {
    return this.p.Expr.isLocal() || this.p.JPath.isLocal();
};

yate.asts.jpath_filter.getScope = function() {
    return yate.Scope.commonScope( this.p.Expr.getScope(), this.p.JPath.getScope() );
};

yate.asts.jpath_filter.w_prepare = function() {
    this.p.Expr.cast('nodeset');
};

yate.asts.jpath_filter.w_validate = function() {
    if ( !this.p.Expr.getType('nodeset') ) {
        this.p.Expr.error('Type should be NODESET');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  simple_jpath
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.simple_jpath = {};

yate.asts.simple_jpath.options = {
    base: 'inline_expr'
};

yate.asts.simple_jpath._getType = no.value('nodeset');

yate.asts.simple_jpath._init = function(jpath) {
    this.p.JPath = jpath;
    this.p.Name = jpath.p.Steps.first().p.Name;
};

yate.asts.simple_jpath.isLocal = function() {
    return this.p.JPath.isLocal();
};

yate.asts.simple_jpath.getScope = function() {
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

yate.asts.arglist = {};

yate.asts.arglist.options = {
    mixin: 'items'
};

yate.asts.arglist.jssep__defaults = '\n';

yate.asts.arglist.yatesep__ = ', ';



//  ---------------------------------------------------------------------------------------------------------------  //
//  arglist_item
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.arglist_item = {};

yate.asts.arglist_item.w_action = function() {
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

    this.p.Id = this.state.vid++;
};

yate.asts.arglist_item.isConst = no.false;

yate.asts.arglist_item._getType = function() {
    var typedef = this.p.Typedef;
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

yate.asts.arglist_item.w_prepare = function() {
    if (this.p.Default) {
        this.p.Default.cast( this.getType() );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  callargs
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.callargs = {};

yate.asts.callargs.options = {
    mixin: 'items'
};

yate.asts.callargs.jssep__ = ', ';

yate.asts.callargs.yatesep__ = ', ';

//  ---------------------------------------------------------------------------------------------------------------  //
//  callarg
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.callarg = {};

yate.asts.callarg._getType = function() {
    return this.p.Expr.getType();
};

yate.asts.callarg.isLocal = function() {
    return this.p.Expr.isLocal();
};

yate.asts.callarg.oncast = function(to) {
    this.p.Expr.cast(to);
};



//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.pair = {};

yate.asts.pair._getType = no.value('pair');

yate.asts.pair.w_setTypes = function() {
    this.p.Key.cast('scalar');

    var type = this.p.Value.getType();
    if (type === 'nodeset') {
        this.p.Value.cast('data');
    } else {
        this.p.Value.cast(type);
    }
};

yate.asts.pair.w_prepare = function() {
    var value = this.p.Value;

    if ( !value.inline() ) {
        value.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.object = {};

yate.asts.object._getType = no.value('object');

yate.asts.object.w_setTypes = function() {
    this.p.Block.cast('pair');
};

yate.asts.object.setAsList = function() {
    this.f.AsList = true;
};

yate.asts.object.w_prepare = function() {
    if (this.f.AsList) {
        this.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.array = {};

yate.asts.array._getType = no.value('array');

yate.asts.array.w_list = function() {
    this.p.Block.setAsList();
};

yate.asts.array.setAsList = function() {
    this.f.AsList = true;
};

yate.asts.array.w_prepare = function() {
    if (this.f.AsList) {
        this.rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.cdata = {};

yate.asts.cdata._getType = no.value('xml');

