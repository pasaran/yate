var fs_ = require('fs');
var path_ = require('path');
var vm_ = require('vm');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./parser.js');
require('./grammar.js');
require('./factory.js');
require('./asts.js');

//  ---------------------------------------------------------------------------------------------------------------  //

//  Create compiler.
//
//      options = {
//          include_dir: [ '/usr/share/yate/modules/', '.' ]
//      }
//
yate.Compiler = function(options) {
    this.options = options = options || {};

    options.include_dir = options.include_dir || [];

    var factory = new yate.Factory(yate.asts);
    this.parser = new yate.Parser(yate.grammar, factory);

    this._cache = {};
    this._watched = {};
}

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Compiler.prototype.parse = function(filename) {
    var ast = this._cache[filename];

    if (!ast) {
        ast = this._cache[filename] = this.parser.parse(filename, 'module');

        if (this.options.watch) {
            var that = this;
            fs_.watchFile(filename, function (curr, prev) {
                that._watched[filename] = true;

                if ( prev.mtime.getTime() !== curr.mtime.getTime() ) {
                    that.uncache(filename);
                }
            });
        }
    }

    return ast.clone();
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Compiler.prototype.ast_before = function(filename) {
    var ast = this.parse(filename);

    return ast;
};

yate.Compiler.prototype.ast_after = function(filename, params) {
    var ast = this.parse(filename);

    ast = this._walk(ast, params);

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Compile.
//
//      params = {
//          target: 'node',
//          include_dir: [ '/usr/share/yate/modules', 'project/modules' ],
//          external: [ 'yate-stdlib/data.js', 'external/time.js' ]
//      }
//

yate.Compiler.prototype.compile_to_string = function(filename, params) {
    var ast = this.ast_after(filename, params);

    var js = ast.js();

    return js;
};

yate.Compiler.prototype.compile_to_file = function(filename, params) {
    var js = this.compile_to_string(filename, params);

    var suffix = (params.target === 'node') ? '.node.js' : '.js';
    var outname = filename + suffix;

    fs_.writeFileSync(filename + suffix, js, 'utf-8');

    return outname;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Compiler.prototype._walk = function(ast, params) {
    params = params || {};

    ast.target = params.target;
    ast.externals = no.array(params.externals);

    var include_dir = no.array(params.include_dir);

    //  Фазы-проходы по дереву

    //  console.time('walk');

    //  Раскрываем include'ы.
    //
    //  console.time('deinclude');
    ast.walkdo(function(ast) {
        ast.w_deinclude();
    });
    //  console.timeEnd('deinclude');

    //  Раскрываем import'ы.
    //
    //  console.time('deimport');
    ast.walkdo(function(ast) {
        ast.w_deimport(include_dir);
    });
    //  console.timeEnd('deimport');

    //  Раскладываем в блоках все из Items по кучкам:
    //  Defs, Exprs, Templates.
    //
    //  console.time('deitemize');
    ast.dowalk(function(ast) {
        ast.w_deitemize();
    });
    //  console.timeEnd('deitemize');

    //  Сохраняем дерево в плоский список.
    //
    var list_dowalk = [];
    var list_walkdo = [];
    function build(ast, parent) {
        //  dowalk -- сперва сохраняем текущее ast, потом детей.
        list_dowalk.push(ast);

        //  Проставляем родителя.
        ast.parent = parent;
        //  Создаем scope.
        ast.w_set_scope();

        //  Идем вниз по дереву.
        ast.apply(build, ast);

        //  walkdo -- сперва сохраняем детей, потом текущее ast.
        list_walkdo.push(ast);
    };
    //  console.time('lists, parents, scope');
    build(ast, null);
    //  console.timeEnd('lists, parents, scope');

    //  Действие над каждой нодой в ast,
    //  не выходящее за рамки этой ноды и ее state/scope/context.
    //
    //  console.time('action');
    for (var i = 0, l = list_walkdo.length; i < l; i++) {
        list_walkdo[i].w_action();
    }
    //  console.timeEnd('action');

    //  console.time('validate & set_types');
    for (var i = 0, l = list_dowalk.length; i < l; i++) {
        var item = list_dowalk[i];

        //  Валидация. Проверяем типы, определенность переменных/функций и т.д.
        item.w_validate();
        //  Вычисляем типы и приводим к нужным типам соответствующие ноды.
        item.w_set_types();
    }
    //  console.timeEnd('validate & set_types');

    //  Важно! Только после этого момента разрешается вызывать метод get_type() у нод.
    //  В предыдущих фазах он никогда не должен вызываться.

    //  Вытаскиваем определения (vars, funcs, jpaths, predicates, keys) в правильном порядке.
    //
    //  console.time('extract_defs');
    for (var i = 0, l = list_walkdo.length; i < l; i++) {
        list_walkdo[i].w_extract_defs();
    }
    //  console.timeEnd('extract_defs');

    //  Подготовка к кодогенерации.
    //  console.time('prepare');
    for (var i = 0, l = list_dowalk.length; i < l; i++) {
        list_dowalk[i].w_prepare();
    }
    //  console.timeEnd('prepare');

    //  Трансформируем некоторые ноды (в частности, заворачиваем в cast)/
    //
    //  console.time('transform');
    ast.walkdo(function(ast, params, pkey, pvalue) {
        var ast_ = ast.w_transform();
        if (ast_) {
            pvalue[pkey] = ast_;
        }
    });
    //  console.timeEnd('transform');

    //  console.timeEnd('walk');

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Compiler.prototype.uncache = function(filename) {
    if (filename) {
        this._cache[filename] = null;
    } else {
        this._cache = {};
    }
};

yate.Compiler.prototype.unwatch = function(filename) {
    var watched = this._watched;

    if (filename) {
        fs_.unwatchFile(filename);
    } else {
        for (var filename in watched) {
            fs_.unwatchFile(filename);
        }

        this._watched = {};
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

