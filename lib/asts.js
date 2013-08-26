var path_ = require('path');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./types.js');
require('./consts.js');
require('./scope.js');
require('./ast.js');
require('./compiler.js');

var yr = require('./runtime.js');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items = {};

yate.asts.items._init = function() {
    this.Items = [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.add = function(item) {
    this.Items.push(item);
};

yate.asts.items.length = function() {
    return this.Items.length;
};

yate.asts.items.first = function() {
    return this.Items[0];
};

yate.asts.items.last = function() {
    var items = this.Items;

    return items[items.length - 1];
};

yate.asts.items.empty = function() {
    return (this.Items.length === 0);
};

yate.asts.items.iterate = function(callback) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback( items[i], i );
    }
};

yate.asts.items.grep = function(callback) {
    return this.Items.filter(callback);
};

yate.asts.items.map = function(callback) {
    return this.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.code = function(lang, mode) {
    mode = mode || '';

    var result = this._code(lang, mode);
    if (result !== undefined) {
        return result;
    }

    var items = this.Items;
    var l = items.length;

    if (!l) {
        return '';
    }

    var sep = this[lang + 'sep__' + mode] || '';

    var r = items[0].code(lang, mode);
    for (var i = 1; i < l; i++) {
        r += sep + items[i].code(lang, mode);
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.toString = function() {
    var items = this.Items;

    if (items.length > 0) {
        var r = items.join('\n').replace(/^/gm, '    ');

        return this.id + ' *\n' + r;
    }

    return '';
};

/*
yate.asts.items.to_json = function() {
    return this.map(function(item) {
        return item.to_json();
    });
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.some_is = function(method) {
    var items = this.Items;

    for (var i = 0, l = items.length; i < l; i++) {
        if ( items[i][method]() ) {
            return true;
        }
    }

    return false;
};

yate.asts.items.all_is = function(method) {
    var items = this.Items;

    for (var i = 0, l = items.length; i < l; i++) {
        if ( !items[i][method]() ) { return false; }
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.clone = function() {
    var ast = this.factory.make(this.id, this.pos);

    var ast_items = [];
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        ast_items[i] = items[i].clone();
    }

    ast.Items = ast_items;

    return ast;
}

yate.asts.items.apply = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], params);
    }
};

yate.asts.items.walkdo = function(callback, params, pkey, pvalue) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pkey, pvalue);
};

yate.asts.items.dowalk = function(callback, params, pkey, pvalue) {
    callback(this, params, pkey, pvalue);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

yate.asts.items.mergeWith = function(ast) {
    this.Items = ast.Items.concat(this.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items._get_type = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var current_id = items[0].id;
    var current_type = items[0].get_type();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var next_type = item.get_type();

        var common_type = yate.types.join_type(current_type, next_type);
        if (common_type == 'none') {
            item.error('Несовместимые типы ' + current_type + ' (' + current_id + ') и ' + next_type + ' (' + item.id + ')');
        }
        current_id = item.id;
        current_type = common_type;
    }

    return current_type;
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

yate.asts.items.is_local = function() {
    return this.some_is('is_local');
};

yate.asts.items.is_const = function() {
    return this.all_is('is_const');
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.get_scope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].get_scope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.common_scope( scope, items[i].get_scope() );
    }

    return scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //
//  module
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.module = {};

yate.asts.module.options = {
    //  FIXME: Нужен ли модулю scope?
    //  scope: true,

    props: 'Block'
};

yate.asts.module.w_prepare = function() {
    this.filename = this.pos.filename;

    this.name = this.make('string_literal', {
        Value: path_.basename(this.filename)
    });

    var externals = this.externals;

    if (externals) {
        var Externals = this.Externals = this.make('external_files');
        for (var i = 0, l = externals.length; i < l; i++) {
            var extname = this.rel_module_name( this.externals[i] );

            Externals.add( this.make(
                'external_file',
                {
                    Filename: this.make('string_literal', {
                        Value: extname
                    })
                }
            ) );
        }
    }
};

yate.asts.external_files = {};

yate.asts.external_files.options = {
    mixin: 'items'
};

yate.asts.external_file = {};

yate.asts.external_file.options = {
    props: 'Filename'
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.module_name = {};

yate.asts.module_name.options = {
    props: 'Value'
};

yate.asts.include = {};

yate.asts.include.options = {
    props: 'Filename'
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

yate.asts.body = {};

yate.asts.body.options = {
    props: 'Block'
};

yate.asts.body._get_type = function() {
    return this.Block.get_type();
};

yate.asts.body.closes = function() {
    return this.Block.closes();
};

yate.asts.body.oncast = function(to) {
    this.Block.cast(to);
};

yate.asts.body.set_prev_opened = function(prev_opened) {
    this.Block.set_prev_opened(prev_opened);
};

yate.asts.body.is_local = function() {
    return this.Block.is_local();
};

yate.asts.body.is_inline = function() {
    return this.Block.is_inline();
};

yate.asts.body.set_as_list = function() {
    this.AsList = true;
    this.Block.set_as_list();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  block
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.block = {};

yate.asts.block.options = {
    props: 'Items Defs Templates Exprs',

    scope: true
};

yate.asts.block._init = function() {
    //  Хранилище всего содержимого блока. Заполняется при парсинге.
    //  FIXME: А нужно же удалить эти Items после того,
    //  как мы разложили все по кучкам.
    this.Items = this.make('block_items');

    //  После парсинга все элементы блока раскладываются на отдельные кучки.
    this.Defs = this.make('block_defs');
    this.Templates = this.make('block_templates');
    this.Exprs = this.make('block_exprs');
};

yate.asts.block._get_type = function() {
    return this.Exprs.get_type();
};

yate.asts.block.w_set_types = function() {
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

yate.asts.block.w_deinclude = function() {
    var compiler = new yate.Compiler();
    var a = [];

    this.Items.iterate(function(item) {
        if (item.id === 'include') {
            var ast = compiler.parse(item.Filename);
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

yate.asts.block.w_deimport = function() {
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
                var ast = yate.AST.from_json(def, input);
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

yate.asts.block.w_deitemize = function() {
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

yate.asts.block.oncast = function(to) {
    this.Exprs.cast(to);
};

yate.asts.block.closes = function() {
    //  FIXME: Может таки унести это в block_exprs.closes?
    var exprs = this.Exprs;
    if ( exprs.empty() ) { return false; }

    return exprs.first().closes();
};

yate.asts.block.set_prev_opened = function(prev_opened) {
    this.prev_opened = prev_opened;
};

yate.asts.block.mergeWith = function(block) {
    this.Imports.mergeWith(block.Imports);
    this.Defs.mergeWith(block.Defs);
    this.Templates.mergeWith(block.Templates);
    this.Exprs.mergeWith(block.Exprs);
};

yate.asts.block.is_local = function() {
    return this.Exprs.is_local();
};

yate.asts.block.is_inline = function() {
    return (
        this.Templates.empty() &&
        !this.scope.defs.length &&
        this.Exprs.length() === 1 &&
        this.Exprs.first().is_inline()
    );
};

yate.asts.block.js__matcher = function() {
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

yate.asts.block.js__defs = function() {
    var defs = this.scope.defs;
    var r = [];
    for (var i = 0, l = defs.length; i < l; i++) {
        r.push( defs[i].js('defs') );
    }
    return r.join('\n\n');
};

yate.asts.block.set_as_list = function() {
    this.AsList = true;
    this.Exprs.iterate(function(item) {
        item.set_as_list();
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

yate.asts.template.options = {
    props: 'Selectors Mode Args Body'
};

yate.asts.template.w_action = function() {
    this.tid = this.state.tid++;
};

yate.asts.template.w_set_types = function() {
    this.Body.cast( this.get_type() );
};

yate.asts.template._get_type = function() {
    var type = this.Body.get_type();
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
        var step = ( selector.is_root() ) ? '' : selector.lastName();
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

yate.asts.template_mode.options = {
    props: 'Value'
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  var_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.var_ = {};

yate.asts.var_.options = {
    props: 'Name Value'
};

yate.asts.var_.w_action = function() {
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

yate.asts.var_._get_type = function() {
    return this.Value.get_type();
};

yate.asts.var_.w_set_types = function() {
    this.Value.cast();
};

yate.asts.var_.w_prepare = function() {
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

yate.asts.var_.w_extract_defs = function() {
    this.scope.defs.push(this);
};

yate.asts.var_.is_const = function() {
    return this.Value.is_const();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  function_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.function_ = {};

yate.asts.function_.options = {
    props: 'Name Args Body'
};

yate.asts.function_.w_action = function() {
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

yate.asts.function_.w_validate = function() {
    if (this.Body.get_type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

yate.asts.function_._get_type = function() {
    return this.Body.get_type();
};

yate.asts.function_.w_set_types = function() {
    this.Body.cast();
};

yate.asts.function_.w_extract_defs = function() {
    this.scope.defs.push(this);
};

yate.asts.function_.is_local = function() {
    return this.Body.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  key
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.key = {};

yate.asts.key.options = {
    props: 'Name Nodes Use Body'
};

yate.asts.key.w_action = function() {
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

yate.asts.key.w_validate = function() {
    if ( !this.Nodes.get_type('nodeset') ) {
        this.Nodes.error('Nodeset is required');
    }
    var useType = this.Use.get_type();
    if (useType !== 'scalar' && useType !== 'nodeset') {
        this.Use.error('Scalar or nodeset is required');
    }
};

yate.asts.key._get_type = function() {
    return this.Body.get_type();
};

yate.asts.key.w_prepare = function() {
    if (this.Use.get_type() !== 'nodeset') {
        this.Use.cast('scalar');
    }
    this.Body.cast();
};

yate.asts.key.w_extract_defs = function() {
    this.scope.defs.push(this);
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  external
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.external = {};

yate.asts.external.options = {
    props: 'Type Name ArgTypes'
};

yate.asts.external.w_action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.is_external = true;

    functions[name] = this;
};

yate.asts.external._get_type = function() {
    return this.Type;
};

yate.asts.external.w_extract_defs = function() {
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
    base: 'expr',
    props: 'Condition Then Elses'
};

yate.asts.if_._init = function() {
    this.Elses = this.make('elses');
};

yate.asts.if_._get_type = function() {
    var type = this.Then.get_type();
    this.Elses.iterate(function(item) {
        type = yate.types.common_type( type, item.get_type() );
    });
    return type;
};

yate.asts.if_.w_set_types = function() {
    this.Condition.cast('boolean');
    this.Elses.iterate(function(item) {
        if ( item.is('else_if') ) {
            item.Condition.cast('boolean');
        }
    });
};

yate.asts.if_.oncast = function(to) {
    this.Then.cast(to);
    this.Elses.iterate(function(item) {
        item.Body.cast(to);
    });
};

yate.asts.if_.closes = function() {
    return this.Then.closes() && this.Elses.all_is('closes');
};

yate.asts.if_.set_prev_opened = function(prev_opened) {
    this.Then.set_prev_opened(prev_opened);
    this.Elses.iterate(function(item) {
        item.Body.set_prev_opened(prev_opened);
    });
};

yate.asts.if_.is_local = function() {
    return this.Then.is_local() || this.Elses.is_local();
};

yate.asts.if_.set_as_list = function() {
    this.AsList = true;
    this.Then.set_as_list();
    this.Elses.iterate(function(item) {
        item.set_as_list();
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

yate.asts.else_if.options = {
    props: 'Condition Body'
};

yate.asts.else_if._get_type = function() {
    return this.Body.get_type();
};

yate.asts.else_if.closes = function() {
    return this.Body.closes();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  else_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.else_ = {};

yate.asts.else_.options = {
    props: 'Body'
};

yate.asts.else_._get_type = function() {
    return this.Body.get_type();
};

yate.asts.else_.closes = function() {
    return this.Body.closes();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  for_
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.for_ = {};

yate.asts.for_.options = {
    base: 'expr',
    props: 'Selector Body'
};

yate.asts.for_._get_type = function() {
    var type = this.Body.get_type();

    return yate.types.join_type(type, type);
};

yate.asts.for_.oncast = function(to) {
    this.Body.cast(to);
};

yate.asts.for_.w_prepare = function() {
    this.Body.inc_cid();
};

yate.asts.for_.closes = function() {
    return this.Body.closes();
};

yate.asts.for_.set_prev_opened = function(prev_opened) {
    this.Body.set_prev_opened(prev_opened);
};

yate.asts.for_.is_local = function() {
    return this.Body.is_local();
};

yate.asts.for_.set_as_list = function() {
    this.AsList = true;
    this.Body.set_as_list();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  apply
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.apply = {};

yate.asts.apply.options = {
    base: 'expr',
    props: 'Expr Mode Args'
};

yate.asts.apply._get_type = no.value('xml');

yate.asts.apply.w_validate = function() {
    var Expr = this.Expr;
    if ( !( Expr.get_type('nodeset') || Expr.get_type('object') || Expr.get_type('array') ) ) {
        this.error('Type of expression should be NODESET');
    }
};

yate.asts.apply.w_prepare = function() {
    var Expr = this.Expr;
    if (Expr.id === 'object' || Expr.id === 'array') {
        Expr.inc_rid();
    }
};

yate.asts.apply.closes = no.false;

yate.asts.apply.set_as_list = function() {
    this.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  value
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.value = {};

yate.asts.value.options = {
    props: 'Value'
};

yate.asts.value._get_type = function() {
    return this.Value.get_type();
};

yate.asts.value.oncast = function(to) {
    this.Value.cast(to);
};

yate.asts.value.is_inline = function() {
    return this.Value.is_inline();
};

yate.asts.value.closes = function() {
    return this.Value.closes();
};

yate.asts.value.is_local = function() {
    return this.Value.is_local();
};

yate.asts.value.is_const = function() {
    return this.Value.is_const();
};

yate.asts.value.set_as_list = function() {
    this.AsList = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.subexpr = {};

yate.asts.subexpr.options = {
    props: 'Block'
};

yate.asts.subexpr._get_type = function() {
    return this.Block.get_type();
};

yate.asts.subexpr.oncast = function(to) {
    this.Block.cast(to);
};

yate.asts.subexpr.closes = function() {
    return this.Block.closes();
};

yate.asts.subexpr.set_prev_opened = function(prev_opened) {
    this.Block.set_prev_opened(prev_opened);
};

yate.asts.subexpr.set_as_list = function() {
    this.AsList = true;
};

yate.asts.subexpr.w_prepare = function() {
    if (this.AsList) {
        this.Block.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  attr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attr = {};

yate.asts.attr.options = {
    base: 'xml',
    props: 'Name Op Value'
};

yate.asts.attr._get_type = no.value('attr');

yate.asts.attr.w_set_types = function() {
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

yate.asts.attr.w_prepare = function() {
    if ( !this.Value.is_inline() ) {
        this.Value.inc_rid();
    }
};

yate.asts.attr.closes = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attrs_close = {};

yate.asts.attrs_close._get_type = no.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.attrs_open = {};

yate.asts.attrs_open.options = {
    props: 'Name Attrs'
};

yate.asts.attrs_open.copy = function(ast) {
    this.Name = ast.Name;
    this.Attrs = ast.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.child('attrs_open', ...),
    //  но w_set_types для xml_attr случает раньше этого.
    this.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    ast.Attrs = null;
};

yate.asts.attrs_open._get_type = no.value('xml');





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

yate.asts.argtypes = {};

yate.asts.argtypes.options = {
    mixin: 'items'
};

yate.asts.argtype = {};

yate.asts.argtype.options = {
    props: 'Type'
};

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

yate.asts.arglist_item.options = {
    props: 'Typedef Name Default'
};

yate.asts.arglist_item.w_action = function() {
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

yate.asts.arglist_item.is_const = no.false;

yate.asts.arglist_item._get_type = function() {
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

yate.asts.arglist_item.w_prepare = function() {
    if (this.Default) {
        this.Default.cast( this.get_type() );
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

yate.asts.callarg.options = {
    props: 'Expr'
};

yate.asts.callarg._get_type = function() {
    return this.Expr.get_type();
};

yate.asts.callarg.is_local = function() {
    return this.Expr.is_local();
};

yate.asts.callarg.oncast = function(to) {
    this.Expr.cast(to);
};



//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.pair = {};

yate.asts.pair.options = {
    props: 'Key Value'
};

yate.asts.pair._get_type = no.value('pair');

yate.asts.pair.w_set_types = function() {
    this.Key.cast('scalar');

    var type = this.Value.get_type();
    if (type === 'nodeset') {
        this.Value.cast('data');
    } else {
        this.Value.cast(type);
    }
};

yate.asts.pair.w_prepare = function() {
    var value = this.Value;

    if ( !value.is_inline() ) {
        value.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.object = {};

yate.asts.object.options = {
    props: 'Block'
};

yate.asts.object._get_type = no.value('object');

yate.asts.object.w_set_types = function() {
    this.Block.cast('pair');
};

yate.asts.object.set_as_list = function() {
    this.AsList = true;
};

yate.asts.object.w_prepare = function() {
    if (this.AsList) {
        this.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.array = {};

yate.asts.array.options = {
    props: 'Block'
};

yate.asts.array._get_type = no.value('array');

yate.asts.array.w_action = function() {
    this.Block.set_as_list();
};

yate.asts.array.set_as_list = function() {
    this.AsList = true;
};

yate.asts.array.w_prepare = function() {
    if (this.AsList) {
        this.inc_rid();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.cdata = {};

yate.asts.cdata.options = {
    props: 'Value'
};

yate.asts.cdata._get_type = no.value('xml');

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
        result.push( this.child('quote', {
            Expr: this,
            Mode: this.mode
        }) );
    } else {
        result.push(this);
    }
};

yate.asts.inline_expr.is_inline = no.true;

yate.asts.inline_expr.closes = function() {
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

function needCast(from, to) {
    return _needCast[from + '-' + to];
}

yate.asts.inline_expr.w_transform = function() {
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
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_op
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_op = {};

yate.asts.inline_op.options = {
    base: 'inline_expr',
    props: 'Left Op Right'
};

yate.asts.inline_op.w_set_types = function() {
    var signature = this.signature;
    if (signature) {
        this.Left.cast(signature.left);
        if (this.Right) {
            this.Right.cast(signature.right);
        }
    }
};

yate.asts.inline_op.is_local = function() {
    return this.Left.is_local() || ( this.Right && this.Right.is_local() );
};

yate.asts.inline_op._get_type = function() {
    return this.signature.result;
};

yate.asts.inline_op.get_scope = function() {
    var lscope = this.Left.get_scope();
    if (this.Right) {
        var rscope = this.Right.get_scope();
        return yate.Scope.common_scope(lscope, rscope);
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
};

yate.asts.inline_eq.w_set_types = function() {
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

yate.asts.inline_rel = {};

yate.asts.inline_rel.signature = {
    left: 'scalar',
    right: 'scalar',
    result: 'boolean'
};

yate.asts.inline_rel.options = {
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op Right'
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
    base: 'inline_op',
    props: 'Left Op'
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
    base: 'inline_op',
    props: 'Left Op'
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
    base: 'inline_op',
    props: 'Left Op Right'
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_number
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_number = {};

yate.asts.inline_number.options = {
    base: 'inline_expr',
    props: 'Value'
};

yate.asts.inline_number.is_local = no.false;

yate.asts.inline_number.is_const = no.true;

yate.asts.inline_number._get_type = no.value('scalar');


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_string
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_string = {};

yate.asts.inline_string.options = {
    base: 'inline_expr',
    props: 'Value'
};

yate.asts.inline_string._get_type = no.value('scalar');

yate.asts.inline_string.oncast = function(to) {
    this.Value.cast(to);

    //  FIXME: WTF?
    return false;
};

yate.asts.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

yate.asts.inline_string.asString = function() {
    var s = '';

    this.Value.iterate(function(item) {
        s += item.asString();
    });

    return s;
};

yate.asts.inline_string.is_const = function() {
    return this.Value.is_const();
};

yate.asts.inline_string.is_local = function() {
    return this.Value.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_content
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_content = {};

yate.asts.string_content.options = {
    mixin: 'items'
};

yate.asts.string_content._get_type = no.value('scalar');

yate.asts.string_content.jssep__ = ' + ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_expr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_expr = {};

yate.asts.string_expr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

yate.asts.string_expr._get_type = function() {
    return this.Expr.get_type();
};

yate.asts.string_expr.is_local = function() {
    return this.Expr.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  string_literal
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.string_literal = {};

yate.asts.string_literal.options = {
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

yate.asts.string_literal.w_action = function() {
    this.Value = deentitify(this.Value);
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codegen.js
yate.asts.string_literal.yate = function() {
    return this.Value;
};

yate.asts.string_literal._get_type = no.value('scalar');

yate.asts.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.Value = yr.text2attr(this.Value);
    } else if (to === 'xml') {
        this.Value = yr.text2xml(this.Value);
    }

    return false;
};

yate.asts.string_literal.stringify = function() {
    return JSON.stringify(this.Value);
};

yate.asts.string_literal.asString = function() {
    return this.Value;
};

yate.asts.string_literal.is_const = no.true;

yate.asts.string_literal.is_local = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_subexpr
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_subexpr = {};

yate.asts.inline_subexpr.options = {
    base: 'inline_expr',
    props: 'Expr'
};

yate.asts.inline_subexpr.is_local = function() {
    return this.Expr.is_local();
};

yate.asts.inline_subexpr._get_type = function() {
    return this.Expr.get_type();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_var
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_var = {};

yate.asts.inline_var.options = {
    base: 'inline_expr',
    props: 'Name'
};

yate.asts.inline_var.w_action = function() {
    var def = this.def = this.scope.findVar(this.Name);
    if (!def) {
        this.error('Undefined variable ' + this.Name);
    }

    this.vid = def.vid;
};

yate.asts.inline_var._get_type = function() {
    return this.def.get_type();
};

yate.asts.inline_var.is_local = no.false;

yate.asts.inline_var.get_scope = function() {
    return this.def.scope;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  inline_function
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.inline_function = {};

yate.asts.inline_function.options = {
    base: 'inline_expr',
    props: 'Name Args'
};

yate.asts.inline_function._get_type = function() {
    var def = this.def;
    if (def.is_internal) {
        return this.signature.type;
    }

    return def.get_type();
};

yate.asts.inline_function.w_action = function() {
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

yate.asts.inline_function.w_prepare = function() {
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

yate.asts.inline_function.get_scope = function() {
    //  Если в предикате используется вызов функции,
    //  то определение этого jpath'а нужно выводить в этом же scope.
    //  См. ../tests/functions.18.yate
    return this.scope;
};

yate.asts.inline_function.is_local = function() {
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

yate.asts.inline_function.js__internal = function() {
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

yate.asts.inline_internal_function = {};

yate.asts.inline_internal_function.options = {
    props: 'Name'
};

yate.asts.inline_internal_function.copy = function(ast) {
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

yate.asts.inline_internal_function.find_signature = function(callargs) {
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
            if ( !arg || !yate.types.is_convertable( callarg.get_type(), arg ) ) {
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
    base: 'inline_expr',
    props: 'Expr Mode'
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  cast
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.cast = {};

yate.asts.cast.options = {
    base: 'inline_expr',
    props: 'From To Expr'
};

yate.asts.cast._get_type = function() {
    return this.To;
};

yate.asts.cast.is_local = function() {
    return this.Expr.is_local();
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  sort
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.sort = {};

yate.asts.sort.options = {
    base: 'inline_expr',
    props: 'Nodes Order By'
};

yate.asts.sort._get_type = no.value('nodeset');

yate.asts.sort.w_validate = function() {
    if (this.Nodes.get_type() !== 'nodeset') {
        this.Nodes.error('Type should be nodeset.');
    }
};

yate.asts.sort.w_prepare = function() {
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

yate.asts.jpath = {};

yate.asts.jpath.options = {
    base: 'inline_expr',
    props: 'Abs Context Steps'
};

yate.asts.jpath._get_type = no.value('nodeset');

yate.asts.jpath.is_local = function() {
    return !this.Abs;
};

yate.asts.jpath.w_action = function() {
    if ( this.is_simple() ) {
        this.IsSimple = true;
        this.Name = this.Steps.first().Name;
    }
};

yate.asts.jpath.is_simple = function() {
    var steps = this.Steps;
    return ( steps.length() === 1 && steps.first().is('jpath_nametest') );
};

yate.asts.jpath.is_root = function() {
    return this.Abs && this.Steps.empty();
};

yate.asts.jpath.is_self = function() {
    return !this.Abs && this.Steps.empty();
};

yate.asts.jpath.w_validate = function() {
    var context = this.Context;
    if ( context && !context.get_type('nodeset') ) {
        context.error('Invalid type. Should be NODESET');
    }
};

yate.asts.jpath.validateMatch = function() {
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
yate.asts.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.Steps.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if ( step.is('jpath_nametest') ) {
            return step.Name;
        }
    }
    return '';
};

yate.asts.jpath.get_scope = function() {
    return this.Steps.get_scope();
};

yate.asts.jpath.w_extract_defs = function() {
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

yate.asts.jpath_steps = {};

yate.asts.jpath_steps.options = {
    mixin: 'items'
};

yate.asts.jpath_steps.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_dots
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_nametest = {};

yate.asts.jpath_nametest.options = {
    props: 'Name'
};

yate.asts.jpath_dots = {};

yate.asts.jpath_dots.options = {
    props: 'Dots'
};

yate.asts.jpath_dots.w_action = function() {
    this.Length = this.Dots.length - 1;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_predicate
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.jpath_predicate = {};

yate.asts.jpath_predicate.options = {
    props: 'Expr'
};

yate.asts.jpath_predicate.get_scope = function() {
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

yate.asts.jpath_predicate.is_local = function() {
    return this.Expr.is_local();
};

yate.asts.jpath_predicate.isMatchable = function() {
    return this.Expr.is_local() || this.Expr.get_type() === 'boolean';
};

yate.asts.jpath_predicate.w_set_types = function() {
    if (this.is_local() || this.Expr.get_type() === 'boolean') {
        //  .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast('boolean');
    } else {
        //  .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast('scalar');
    }
};

yate.asts.jpath_predicate.w_extract_defs = function() {
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

yate.asts.jpath_filter = {};

yate.asts.jpath_filter.options = {
    base: 'inline_expr',
    props: 'Expr JPath'
};

yate.asts.jpath_filter._get_type = no.value('nodeset');

yate.asts.jpath_filter.is_local = function() {
    return this.Expr.is_local() || this.JPath.is_local();
};

yate.asts.jpath_filter.get_scope = function() {
    return yate.Scope.common_scope( this.Expr.get_scope(), this.JPath.get_scope() );
};

yate.asts.jpath_filter.w_prepare = function() {
    this.Expr.cast('nodeset');
};

yate.asts.jpath_filter.w_validate = function() {
    if ( !this.Expr.get_type('nodeset') ) {
        this.Expr.error('Type should be NODESET');
    }
};


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  simple_jpath
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.simple_jpath = {};

yate.asts.simple_jpath.options = {
    base: 'inline_expr',
    props: 'Name JPath'
};

yate.asts.simple_jpath._get_type = no.value('nodeset');

yate.asts.simple_jpath.copy = function(ast) {
    //  FIXME: А зачем тут хранится ссылка на jpath?
    this.JPath = ast.JPath;
    this.Name = this.JPath.Steps.first().Name;
};

yate.asts.simple_jpath.is_local = function() {
    return this.JPath.is_local();
};

yate.asts.simple_jpath.get_scope = function() {
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

yate.asts.xml = {};

yate.asts.xml.options = {
    base: 'expr'
};

yate.asts.xml._get_type = no.value('xml');


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
    base: 'xml',
    props: 'Name Attrs'
};

yate.asts.xml_start.toResult = function(result) {
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

yate.asts.xml_end = {};

yate.asts.xml_end.options = {
    base: 'xml',
    props: 'Name'
};

yate.asts.xml_end.w_action = function() {
    if ( yate.consts.shortTags[this.Name] ) {
        this.Short = true;
    }
};

yate.asts.xml_end.toResult = function(result) {
    if (!this.Short) {
        result.push('</' + this.Name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_empty
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_empty = {};

yate.asts.xml_empty.options = {
    base: 'xml',
    props: 'Name Attrs'
};

yate.asts.xml_empty.toResult = function(result) {
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

yate.asts.xml_text = {};

yate.asts.xml_text.options = {
    base: 'xml',
    props: 'Text'
};

yate.asts.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

yate.asts.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_full
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.xml_full = {};

yate.asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};
*/

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

yate.asts.xml_attr.options = {
    props: 'Name Value'
};

yate.asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.Name + '="');
    this.Value.toResult(result);
    result.push('"');
};

yate.asts.xml_attr.w_prepare = function() {
    //  FIXME: Как бы не ходить по дереву так уродливо?
    //  Ответ: Сделать это в attrs_open?
    if ( !this.parent.parent.is('attrs_open') ) {
        this.Value.cast('attrvalue');
    } else {
        this.Value.cast('scalar');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

