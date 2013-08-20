var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');
var path_ = require('path');
var vm_ = require('vm');

//  ---------------------------------------------------------------------------------------------------------------  //

var parser = require('./parser.js');
var AST = require('./ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate actions
//  ---------------------------------------------------------------------------------------------------------------  //

var _cache = {};

yate.parse = function(filename) {
    var ast = _cache[filename];

    if (!ast) {
        ast = _cache[filename] = parser.parse(filename, 'module');
    }

    return ast.clone();
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.compile = function(filename) {

    //  Парсим
    //
    //  console.time('parse');
    var ast = yate.parse(filename);
    //  console.timeEnd('parse');

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
        ast.w_deimport();
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

    /*
    //  Для модулей дампим все глобальные определения в .yate.obj файл.
    if (ast.p.Name) {
        var yobjFilename = filename.replace(/\.yate$/, '.yate.obj');
        var a = [];
        ast.p.Block.scope.defs.forEach(function(def) {
            if ( def.is('var_', 'function_', 'key', 'external') ) {
                a.push( AST.to_json(def) );
            }
        });
        var obj = {
            version: yate.version,
            filename: path_.resolve(filename),
            name: ast.p.Name,
            defs: a
        };
        fs_.writeFileSync(yobjFilename, JSON.stringify(obj), 'utf-8');
    }
    */

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

    //  Генерим код
    //
    //  console.time('js');
    var js = ast.js();
    //  console.timeEnd('js');

    return {
        ast: ast,
        js: js
    };

};

// ----------------------------------------------------------------------------------------------------------------- //

yate.run = function(yate_filename, data, ext_filename, mode) {

    // Читаем runtime.
    var js = fs_.readFileSync( path_.join(__dirname, './runtime.js'), 'utf-8' );

    // Добавляем внешние функции, если есть.
    if (ext_filename) {
        js += fs_.readFileSync( ext_filename, 'utf-8' );
    }

    // Добавляем скомпилированные шаблоны.
    js += yate.compile( yate_filename ).js;

    js += 'var data = ' + getData(data) + ';';

    mode = mode || '';
    js += 'yr.run("main", data, "' + mode + '");';

    var result = vm_.runInNewContext(js, {
        console: console
    });

    function getData(o) {
        if (o.filename) {
            //  Возможность просто передать строку,
            //  содержащую объект с данными. Например:
            //
            //      yate hello.yate '{ username: "nop" }'
            //
            if ( /^\s*[{[]/.test(o.filename) ) {
                return o.filename;
            }
            return fs_.readFileSync(o.filename, 'utf-8');
        }

        return JSON.stringify(o.data);
    }

    return result;
};

// ----------------------------------------------------------------------------------------------------------------- //

