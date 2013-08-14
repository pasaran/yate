var yate = require('./yate.js');

var types = require('./types.js');
var consts = require('./consts.js');
var Scope = require('./scope.js');

var yr = require('./runtime.js');

var AST = require('./ast.js');

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
    var items = this.Items;

    if (items.length > 0) {
        var r = items.join('\n').replace(/^/gm, '    ');

        return this.id + ' *\n' + r;
    }

    return '';
};

/*
asts.items.to_json = function() {
    return this.map(function(item) {
        return item.to_json();
    });
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.some_is = function(method) {
    var items = this.Items;

    for (var i = 0, l = items.length; i < l; i++) {
        if ( items[i][method]() ) {
            return true;
        }
    }

    return false;
};

asts.items.all_is = function(method) {
    var items = this.Items;

    for (var i = 0, l = items.length; i < l; i++) {
        if ( !items[i][method]() ) { return false; }
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

asts.items.walkdo = function(callback, params, pkey, pvalue) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pkey, pvalue);
};

asts.items.dowalk = function(callback, params, pkey, pvalue) {
    callback(this, params, pkey, pvalue);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

asts.items.mergeWith = function(ast) {
    this.Items = ast.Items.concat(this.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._get_type = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var current_id = items[0].id;
    var current_type = items[0].get_type();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var next_type = item.get_type();

        var common_type = types.join_type(current_type, next_type);
        if (common_type == 'none') {
            item.error('Несовместимые типы ' + current_type + ' (' + current_id + ') и ' + next_type + ' (' + item.id + ')');
        }
        current_id = item.id;
        current_type = common_type;
    }

    return current_type;
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

asts.items.is_local = function() {
    return this.some_is('is_local');
};

asts.items.is_const = function() {
    return this.all_is('is_const');
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.get_scope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].get_scope();
    for (var i = 1; i < l; i++) {
        scope = Scope.commonScope( scope, items[i].get_scope() );
    }

    return scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //
//  module
//  ---------------------------------------------------------------------------------------------------------------  //

asts.module = {};

asts.module.options = {
    //  FIXME: Нужен ли модулю scope?
    //  scope: true,

    props: 'Name Block'
};

asts.module_name = {};

asts.module_name.options = {
    props: 'Value'
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

asts.body._get_type = function() {
    return this.Block.get_type();
};

asts.body.closes = function() {
    return this.Block.closes();
};

asts.body.oncast = function(to) {
    this.Block.cast(to);
};

asts.body.set_prev_opened = function(prev_opened) {
    this.Block.set_prev_opened(prev_opened);
};

asts.body.is_local = function() {
    return this.Block.is_local();
};

asts.body.is_inline = function() {
    return this.Block.is_inline();
};

asts.body.set_as_list = function() {
    this.AsList = true;
    this.Block.set_as_list();
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

    //  После парсинга все элементы блока раскладываются на отдельные кучки.
    this.Defs = this.make('block_defs');
    this.Templates = this.make('block_templates');
    this.Exprs = this.make('block_exprs');
};

asts.block._get_type = function() {
    return this.Exprs.get_type();
};

asts.block.w_set_types = function() {
    if (this.AsList) {
        this.Exprs.iterate(function(item) {
            if (item.get_type() === 'nodeset') {
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
            var name = item.Name;
            var module = yate.modules[name];
            if (!module) {
                item.error('Cannot find module "' + name + '"');
            }

            imports.push(name);

            var defs = module.defs;
            var input = yate.parse(module.filename);

            var b = [];
            for (var i = 0, l = defs.length; i < l; i++) {
                var def = defs[i];
                var ast = AST.from_json(def, input);
                ast.isImported = true;
                b.push(ast);

                switch (ast.id) {
                    case 'var_':
                        ast.state.vid = ast.vid + 1;
                        break;
                    case 'function_':
                        ast.state.fid = ast.fid + 1;
                        break;
                    case 'key':
                        ast.state.kid = ast.kid + 1;
                }
            }
            a = b.concat(a);

        } else {
            a.push(item);
        }
    });

    this.Items.Items = a;
    this.imports = JSON.stringify(imports);
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

asts.block.set_prev_opened = function(prev_opened) {
    this.prev_opened = prev_opened;
};

asts.block.mergeWith = function(block) {
    this.Imports.mergeWith(block.Imports);
    this.Defs.mergeWith(block.Defs);
    this.Templates.mergeWith(block.Templates);
    this.Exprs.mergeWith(block.Exprs);
};

asts.block.is_local = function() {
    return this.Exprs.is_local();
};

asts.block.is_inline = function() {
    return (
        this.Templates.empty() &&
        !this.scope.defs.length &&
        this.Exprs.length() === 1 &&
        this.Exprs.first().is_inline()
    );
};

asts.block.js__matcher = function() {
    //  Группируем шаблоны по модам.
    var groups = {};
    this.Templates.iterate(function(template) {
        var mode = template.Mode.Value;

        var info = groups[mode];
        if (!info) {
            info = groups[mode] = {
                templates: [],
                matcher: {}
            };
        }

        info.templates.push(template);
        var steps = template.Selectors.getLastSteps();
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
            var tid = 't' + template.tid;

            var steps = template.Selectors.getLastSteps();
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

asts.block.set_as_list = function() {
    this.AsList = true;
    this.Exprs.iterate(function(item) {
        item.set_as_list();
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
    if ( this.parent.AsList ) { return; }
    if ( this.get_type() !== 'xml' && this.as_type !== 'xml' ) { return; }

    var items = this.Items;
    var l = items.length;
    if (!l) { return; }

    var prev_opened = this.parent.prev_opened; // block.prev_opened.

    var o = [];
    for (var i = 0; i < l; i++) {
        var item = items[i];
        var next = items[i + 1];

        if ( item.closes() && (prev_opened !== false) ) {
            o.push( this.child('attrs_close', this) );

            prev_opened = false;
        }

        o.push(item);

        if ( item.opens() && !(next && next.closes()) ) {
            var lastTag = item.lastTag();

            lastTag.open = true;
            o.push( this.child('attrs_open', lastTag) );

            prev_opened = true;
        }

        item.set_prev_opened(prev_opened);
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
    props: 'Selectors Mode Args Body'
};

asts.template.w_action = function() {
    this.tid = this.state.tid++;
};

asts.template.w_set_types = function() {
    this.Body.cast( this.get_type() );
};

asts.template._get_type = function() {
    var type = this.Body.get_type();
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
        var step = ( selector.is_root() ) ? '' : selector.lastName();
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

    if ( vars[name] ) {
        this.error('Повторное определение переменной ' + name);
    }

    if (this.vid === undefined) {
        this.vid = this.state.vid++;
    }
    this.is_user = true;

    /*
    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.Lazy = true;
    }
    */

    vars[name] = this;
};

asts.var_._get_type = function() {
    return this.Value.get_type();
};

asts.var_.w_set_types = function() {
    this.Value.cast();
};

asts.var_.w_prepare = function() {
    var Value = this.Value;
    //  Выставляем значению переменной специальный флаг.
    if ( Value.is_inline() ) {
        if (Value.get_type() === 'attr') {
            Value.Value.InlineVarValue = true;
        }
    } else {
        Value.inc_rid();
    }
};

asts.var_.w_extract_defs = function() {
    this.scope.defs.push(this);
};

asts.var_.is_const = function() {
    return this.Value.is_const();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  function_
//  ---------------------------------------------------------------------------------------------------------------  //

asts.function_ = {};

asts.function_.options = {
    props: 'Name Args Body'
};

asts.function_.w_action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    if (this.fid === undefined) {
        this.fid = this.state.fid++;
    }
    this.is_user = true;

    functions[name] = this;
};

asts.function_.w_validate = function() {
    if (this.Body.get_type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

asts.function_._get_type = function() {
    return this.Body.get_type();
};

asts.function_.w_set_types = function() {
    this.Body.cast();
};

asts.function_.w_extract_defs = function() {
    this.scope.defs.push(this);
};

asts.function_.is_local = function() {
    return this.Body.is_local();
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

    if (this.kid === undefined) {
        this.kid = this.state.kid++;
    }
    this.is_key = true;

    functions[name] = this;
};

asts.key.w_validate = function() {
    if ( !this.Nodes.get_type('nodeset') ) {
        this.Nodes.error('Nodeset is required');
    }
    var useType = this.Use.get_type();
    if (useType !== 'scalar' && useType !== 'nodeset') {
        this.Use.error('Scalar or nodeset is required');
    }
};

asts.key._get_type = function() {
    return this.Body.get_type();
};

asts.key.w_prepare = function() {
    if (this.Use.get_type() !== 'nodeset') {
        this.Use.cast('scalar');
    }
    this.Body.cast();
};

asts.key.w_extract_defs = function() {
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

    this.is_external = true;

    functions[name] = this;
};

asts.external._get_type = function() {
    return this.Type;
};

asts.external.w_extract_defs = function() {
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

asts.if_._get_type = function() {
    var type = this.Then.get_type();
    this.Elses.iterate(function(item) {
        type = types.common_type( type, item.get_type() );
    });
    return type;
};

asts.if_.w_set_types = function() {
    this.Condition.cast('boolean');
    this.Elses.iterate(function(item) {
        if ( item.is('else_if') ) {
            item.Condition.cast('boolean');
        }
    });
};

asts.if_.oncast = function(to) {
    this.Then.cast(to);
    this.Elses.iterate(function(item) {
        item.Body.cast(to);
    });
};

asts.if_.closes = function() {
    return this.Then.closes() && this.Elses.all_is('closes');
};

asts.if_.set_prev_opened = function(prev_opened) {
    this.Then.set_prev_opened(prev_opened);
    this.Elses.iterate(function(item) {
        item.Body.set_prev_opened(prev_opened);
    });
};

asts.if_.is_local = function() {
    return this.Then.is_local() || this.Elses.is_local();
};

asts.if_.set_as_list = function() {
    this.AsList = true;
    this.Then.set_as_list();
    this.Elses.iterate(function(item) {
        item.set_as_list();
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
    props: 'Condition Body'
};

asts.else_if._get_type = function() {
    return this.Body.get_type();
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

asts.else_._get_type = function() {
    return this.Body.get_type();
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

asts.for_._get_type = function() {
    var type = this.Body.get_type();

    return types.join_type(type, type);
};

asts.for_.oncast = function(to) {
    this.Body.cast(to);
};

asts.for_.w_prepare = function() {
    this.Body.inc_cid();
};

asts.for_.closes = function() {
    return this.Body.closes();
};

asts.for_.set_prev_opened = function(prev_opened) {
    this.Body.set_prev_opened(prev_opened);
};

asts.for_.is_local = function() {
    return this.Body.is_local();
};

asts.for_.set_as_list = function() {
    this.AsList = true;
    this.Body.set_as_list();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  apply
//  ---------------------------------------------------------------------------------------------------------------  //

asts.apply = {};

asts.apply.options = {
    base: 'expr',
    props: 'Expr Mode Args'
};

asts.apply._get_type = yate.value('xml');

asts.apply.w_validate = function() {
    var Expr = this.Expr;
    if ( !( Expr.get_type('nodeset') || Expr.get_type('object') || Expr.get_type('array') ) ) {
        this.error('Type of expression should be NODESET');
    }
};

asts.apply.w_prepare = function() {
    var Expr = this.Expr;
    if (Expr.id === 'object' || Expr.id === 'array') {
        Expr.inc_rid();
    }
};

asts.apply.closes = yate.false;

asts.apply.set_as_list = function() {
    this.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  value
//  ---------------------------------------------------------------------------------------------------------------  //

asts.value = {};

asts.value.options = {
    props: 'Value'
};

asts.value._get_type = function() {
    return this.Value.get_type();
};

asts.value.oncast = function(to) {
    this.Value.cast(to);
};

asts.value.is_inline = function() {
    return this.Value.is_inline();
};

asts.value.closes = function() {
    return this.Value.closes();
};

asts.value.is_local = function() {
    return this.Value.is_local();
};

asts.value.is_const = function() {
    return this.Value.is_const();
};

asts.value.set_as_list = function() {
    this.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.subexpr = {};

asts.subexpr.options = {
    props: 'Block'
};

asts.subexpr._get_type = function() {
    return this.Block.get_type();
};

asts.subexpr.oncast = function(to) {
    this.Block.cast(to);
};

asts.subexpr.closes = function() {
    return this.Block.closes();
};

asts.subexpr.set_prev_opened = function(prev_opened) {
    this.Block.set_prev_opened(prev_opened);
};

asts.subexpr.set_as_list = function() {
    this.AsList = true;
};

asts.subexpr.w_prepare = function() {
    if (this.AsList) {
        this.Block.inc_rid();
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

asts.attr._get_type = yate.value('attr');

asts.attr.w_set_types = function() {
    this.Name.cast('scalar');
    if ( this.Value.get_type() !== 'xml' ) {
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
    if ( !this.Value.is_inline() ) {
        this.Value.inc_rid();
    }
};

asts.attr.closes = yate.false;


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_close = {};

asts.attrs_close._get_type = yate.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_open = {};

asts.attrs_open.options = {
    props: 'Name Attrs'
};

asts.attrs_open.copy = function(ast) {
    this.Name = ast.Name;
    this.Attrs = ast.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.child('attrs_open', ...),
    //  но w_set_types для xml_attr случает раньше этого.
    this.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    ast.Attrs = null;
};

asts.attrs_open._get_type = yate.value('xml');





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

asts.argtypes = {};

asts.argtypes.options = {
    mixin: 'items'
};

asts.argtype = {};

asts.argtype.options = {
    props: 'Type'
};

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
    var blockScope = this.parent.parent.Body.Block.scope;
    var vars = blockScope.vars;

    var name = this.Name;
    if ( vars[name] ) {
        this.error('Повторное определение аргумента ' + name);
    }

    vars[name] = this;
    //  Заодно меняем и scope.
    this.scope = blockScope;

    this.vid = this.state.vid++;
};

asts.arglist_item.is_const = yate.false;

asts.arglist_item._get_type = function() {
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
        this.Default.cast( this.get_type() );
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

asts.callarg._get_type = function() {
    return this.Expr.get_type();
};

asts.callarg.is_local = function() {
    return this.Expr.is_local();
};

asts.callarg.oncast = function(to) {
    this.Expr.cast(to);
};



//  ---------------------------------------------------------------------------------------------------------------  //

asts.pair = {};

asts.pair.options = {
    props: 'Key Value'
};

asts.pair._get_type = yate.value('pair');

asts.pair.w_set_types = function() {
    this.Key.cast('scalar');

    var type = this.Value.get_type();
    if (type === 'nodeset') {
        this.Value.cast('data');
    } else {
        this.Value.cast(type);
    }
};

asts.pair.w_prepare = function() {
    var value = this.Value;

    if ( !value.is_inline() ) {
        value.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.object = {};

asts.object.options = {
    props: 'Block'
};

asts.object._get_type = yate.value('object');

asts.object.w_set_types = function() {
    this.Block.cast('pair');
};

asts.object.set_as_list = function() {
    this.AsList = true;
};

asts.object.w_prepare = function() {
    if (this.AsList) {
        this.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.array = {};

asts.array.options = {
    props: 'Block'
};

asts.array._get_type = yate.value('array');

asts.array.w_list = function() {
    this.Block.set_as_list();
};

asts.array.set_as_list = function() {
    this.AsList = true;
};

asts.array.w_prepare = function() {
    if (this.AsList) {
        this.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.cdata = {};

asts.cdata.options = {
    props: 'Value'
};

asts.cdata._get_type = yate.value('xml');

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
        result.push( this.child('quote', {
            Expr: this,
            Mode: this.mode
        }) );
    } else {
        result.push(this);
    }
};

asts.inline_expr.is_inline = yate.true;

asts.inline_expr.closes = function() {
    return ( this.get_type() != 'attr' ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
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
    var as_type = this.as_type;

    if ( this.is_simple() && (!as_type || as_type === 'scalar' || as_type === 'boolean') ) {
        return this;
    }

    if ( as_type && needCast( this.get_type(), as_type ) ) {
        return this.child('cast', {
            From: this.get_type(),
            To: as_type,
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

asts.inline_op.w_set_types = function() {
    var signature = this.signature;
    if (signature) {
        this.Left.cast(signature.left);
        if (this.Right) {
            this.Right.cast(signature.right);
        }
    }
};

asts.inline_op.is_local = function() {
    return this.Left.is_local() || ( this.Right && this.Right.is_local() );
};

asts.inline_op._get_type = function() {
    return this.signature.result;
};

asts.inline_op.get_scope = function() {
    var lscope = this.Left.get_scope();
    if (this.Right) {
        var rscope = this.Right.get_scope();
        return Scope.commonScope(lscope, rscope);
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

asts.inline_eq.w_set_types = function() {
    var Left = this.Left;
    var Right = this.Right;

    var lType = Left.get_type();
    var rType = Right.get_type();

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

asts.inline_number.is_local = yate.false;

asts.inline_number.is_const = yate.true;

asts.inline_number._get_type = yate.value('scalar');


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_string = {};

asts.inline_string.options = {
    base: 'inline_expr',
    props: 'Value'
};

asts.inline_string._get_type = yate.value('scalar');

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

asts.inline_string.is_const = function() {
    return this.Value.is_const();
};

asts.inline_string.is_local = function() {
    return this.Value.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_content
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_content = {};

asts.string_content.options = {
    mixin: 'items'
};

asts.string_content._get_type = yate.value('scalar');

asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.string_expr = {};

asts.string_expr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

asts.string_expr._get_type = function() {
    return this.Expr.get_type();
};

asts.string_expr.is_local = function() {
    return this.Expr.is_local();
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

asts.string_literal._get_type = yate.value('scalar');

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

asts.string_literal.is_const = yate.true;

asts.string_literal.is_local = yate.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.inline_subexpr = {};

asts.inline_subexpr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

asts.inline_subexpr.is_local = function() {
    return this.Expr.is_local();
};

asts.inline_subexpr._get_type = function() {
    return this.Expr.get_type();
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

    this.vid = def.vid;
};

asts.inline_var._get_type = function() {
    return this.def.get_type();
};

asts.inline_var.is_local = yate.false;

asts.inline_var.get_scope = function() {
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

asts.inline_function._get_type = function() {
    var def = this.def;
    if (def.is_internal) {
        return this.signature.type;
    }

    return def.get_type();
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
        if ( !def && (( params = consts.internalFunctions[name] )) ) {
            //  Если есть, создаем ее.
            params = {
                Name: name,
                signatures: (params instanceof Array) ? params : [ params ]
            };
            def = internalFunctions[name] = this.child('inline_internal_function', params);
        }
    }

    if (!def) {
        this.error('Undefined function ' + name);
    }

    this.def = def;

    if (def.is_external) {
        this.is_external = true;

    } else if (def.is_user) {
        this.fid = def.fid;
        this.is_user = true;

    } else if (def.is_key) {
        this.kid = def.kid;
        this.is_key = true;

    } else {
        //  Это внутрення функция.
        this.signature = def.find_signature(this.Args.Items);
        if (!this.signature) {
            this.error('Cannot find signature for this arguments');
        }
    }
};

asts.inline_function.w_prepare = function() {
    var def = this.def;
    var args = this.Args;

    if (def.is_external) {
        var argTypes = def.ArgTypes.Items;
        args.iterate(function(arg, i) {
            var argtype = argTypes[i];
            var type = (argtype) ? argtype.Type : 'scalar';
            arg.cast(type);
        });

    } else if (def.is_key) {
        var type = args.first().get_type();
        if (type !== 'nodeset') {
            args.first().cast('scalar');
        }

    } else if (def.is_internal) {
        var signature = this.signature;
        var argtypes = signature.args;
        var defType = signature.defType;
        args.iterate(function(arg, i) {
            arg.cast( argtypes[i] || defType );
        });

    } else if (def.is_user) {
        var defArgs = def.Args.Items;
        args.iterate(function(arg, i) {
            arg.cast( defArgs[i].Typedef || 'scalar' );
        });

    }
};

asts.inline_function.get_scope = function() {
    //  Если в предикате используется вызов функции,
    //  то определение этого jpath'а нужно выводить в этом же scope.
    //  См. ../tests/functions.18.yate
    return this.scope;
};

asts.inline_function.is_local = function() {
    if (this.def.is_internal) {
        if (this.signature.local) {
            return true;
        }

        return this.Args.some_is('is_local');
        /*
        var args = this.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].is_local() ) { return true; }
        }
        return false;
        */
    }

    if (this.is_external || this.is_key) {
        return this.Args.some_is('is_local');
        /*
        var args = this.Args.p;
        for (var i = 0, l = args.length; i < l; i++) {
            if ( args[i].is_local() ) { return true; }
        }
        return false;
        */
    }

    return this.def.is_local();
};

asts.inline_function.js__internal = function() {
    var signature = this.signature;
    this.Signature = signature.args.join(',');
    return AST.js.generate('internal_function_' + this.Name, this);
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

asts.inline_internal_function.copy = function(ast) {
    this.Name = ast.Name;
    var signatures = this.signatures = ast.signatures;

    for (var i = 0, l = signatures.length; i < l; i++) {
        prepare_signature( signatures[i] );
    }

    this.is_internal = true;

    function prepare_signature(signature) {
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

asts.inline_internal_function.find_signature = function(callargs) {
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
            if ( !arg || !types.is_convertable( callarg.get_type(), arg ) ) {
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

asts.cast._get_type = function() {
    return this.To;
};

asts.cast.is_local = function() {
    return this.Expr.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  sort
//  ---------------------------------------------------------------------------------------------------------------  //

asts.sort = {};

asts.sort.options = {
    base: 'inline_expr',
    props: 'Nodes Order By'
};

asts.sort._get_type = yate.value('nodeset');

asts.sort.w_validate = function() {
    if (this.Nodes.get_type() !== 'nodeset') {
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

asts.jpath._get_type = yate.value('nodeset');

asts.jpath.is_local = function() {
    return !this.Abs;
};

asts.jpath.w_action = function() {
    if ( this.is_simple() ) {
        this.IsSimple = true;
        this.Name = this.Steps.first().Name;
    }
};

asts.jpath.is_simple = function() {
    var steps = this.Steps;
    return ( steps.length() === 1 && steps.first().is('jpath_nametest') );
};

asts.jpath.is_root = function() {
    return this.Abs && this.Steps.empty();
};

asts.jpath.is_self = function() {
    return !this.Abs && this.Steps.empty();
};

asts.jpath.w_validate = function() {
    var context = this.Context;
    if ( context && !context.get_type('nodeset') ) {
        context.error('Invalid type. Should be NODESET');
    }
};

asts.jpath.validateMatch = function() {
    var steps = this.Steps;
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
    var steps = this.Steps.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if ( step.is('jpath_nametest') ) {
            return step.Name;
        }
    }
    return '';
};

asts.jpath.get_scope = function() {
    return this.Steps.get_scope();
};

asts.jpath.w_extract_defs = function() {
    //  Каноническая запись jpath.
    var key = this.yate();

    var state = this.state;
    //  scope, в котором этот jpath имеет смысл.
    //  Например, .foo.bar[ .count > a + b ] имеет смысл только внутри scope'а,
    //  в котором определены переменные a и b.
    var scope = this.get_scope();

    //  Если этот jpath еще не хранится в scope, то добаляем его туда.
    var jid = scope.jkeys[key];
    if (jid === undefined) {
        jid = scope.jkeys[key] = state.jid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.jid = jid;
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

asts.jpath_predicate.get_scope = function() {
    if ( this.is_local() ) {
        return this.Expr.get_scope();
    } else {
        //  FIXME: Временный костыль. Выражение .item[ /.index ] должно быть индексом,
        //  но из-за того, что оно глобальное, оно уезжает в глобальный scope.
        //  А индексы у меня сейчас не предусмотрены глобальные, т.к. там выражение
        //  явно генерится, без функциональной обертки.
        return this.scope;
    }
};

asts.jpath_predicate.is_local = function() {
    return this.Expr.is_local();
};

asts.jpath_predicate.isMatchable = function() {
    return this.Expr.is_local() || this.Expr.get_type() === 'boolean';
};

asts.jpath_predicate.w_set_types = function() {
    if (this.is_local() || this.Expr.get_type() === 'boolean') {
        //  .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast('boolean');
    } else {
        //  .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast('scalar');
    }
};

asts.jpath_predicate.w_extract_defs = function() {
    //  Каноническая запись предиката.
    var key = this.Expr.yate();

    var state = this.state;
    //  См. примечание в jpath.action().
    var scope = this.get_scope();

    //  Если этот predicate еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.pid = pid;
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

asts.jpath_filter._get_type = yate.value('nodeset');

asts.jpath_filter.is_local = function() {
    return this.Expr.is_local() || this.JPath.is_local();
};

asts.jpath_filter.get_scope = function() {
    return Scope.commonScope( this.Expr.get_scope(), this.JPath.get_scope() );
};

asts.jpath_filter.w_prepare = function() {
    this.Expr.cast('nodeset');
};

asts.jpath_filter.w_validate = function() {
    if ( !this.Expr.get_type('nodeset') ) {
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

asts.simple_jpath._get_type = yate.value('nodeset');

asts.simple_jpath.copy = function(ast) {
    //  FIXME: А зачем тут хранится ссылка на jpath?
    this.JPath = ast.JPath;
    this.Name = this.JPath.Steps.first().Name;
};

asts.simple_jpath.is_local = function() {
    return this.JPath.is_local();
};

asts.simple_jpath.get_scope = function() {
    return this.JPath.get_scope();
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

asts.xml._get_type = yate.value('xml');


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
            opened.push(item.Name);
        } else if (item.is('xml_end')) {
            var name = opened.pop();
            if (!name) {
                //  FIXME: Если p.Name === true, будет не очень внятное сообщение об ошибке.
                that.error('Закрывающий тег </' + item.Name + '> не был предварительно открыт');
            } else if ( (item.Name !== name) && (item.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            //  FIXME: Не очень подходящее место для этого действия.
            //  Лучше бы унести это в какой-то .action().
            item.Name = name;
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
        result.push( (consts.shortTags[name]) ? '/>' : '>' );
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
    if ( consts.shortTags[this.Name] ) {
        this.Short = true;
    }
};

asts.xml_end.toResult = function(result) {
    if (!this.Short) {
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


