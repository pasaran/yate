var pt = require('parse-tools');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./types.js');
require('./scope.js');
require('./consts.js');
require('./ast.js');

var entities = require('./entities.json');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

var asts = require('./asts.js');

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
            var ast = yate.parse(item.p.Filename, 'module');
            ast.dowalk(function(ast) {
                ast.w_deinclude();
            });
            a = a.concat(ast.p.Block.p.Items.p.Items);
        } else {
            a.push(item);
        }
    });

    this.Items.p.Items = a;
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

asts.apply._getType = no.value('xml');

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

asts.apply.closes = no.false;

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

asts.attr._getType = no.value('attr');

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

asts.attr.closes = no.false;


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_close = {};

asts.attrs_close._getType = no.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //

asts.attrs_open = {};

asts.attrs_open.options = {
    props: 'Name Attrs'
};

asts.attrs_open._init = function(item) {
    this.Name = item.p.Name;
    this.Attrs = item.p.Attrs;
    //  FIXME: По идее, переопределение parent должно происходить в this.make('attrs_open', ...),
    //  но w_setTypes для xml_attr случает раньше этого.
    this.Attrs.parent = this;
    //  FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    item.p.Attrs = null;
};

asts.attrs_open._getType = no.value('xml');





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

asts.arglist_item.isConst = no.false;

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

asts.pair._getType = no.value('pair');

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

asts.object._getType = no.value('object');

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

asts.array._getType = no.value('array');

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

asts.cdata._getType = no.value('xml');

//  ---------------------------------------------------------------------------------------------------------------  //


