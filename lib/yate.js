var fs_ = require('fs');
var path_ = require('path');
var vm_ = require('vm');

//  ---------------------------------------------------------------------------------------------------------------  //

var Parser = require('parse-tools/parser.js');

var factory = require('./factory.js');
var grammar = require('./grammar.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.parse = function(filename) {
    var parser = new Parser(grammar, factory);

    var ast;
    try {
        ast = parser.parse(filename, 'module');
    } catch (e) {
        if (e instanceof Parser.Error) {
            throw e.toString();
        } else {
            throw e;
        }
    }

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.walk = function(ast) {

    //  Фазы-проходы по дереву:

    /// console.time('walking');

    //  0. Каждой ноде выставляется поле parent,
    //  кроме того, создается (или наследуются от parent'а) scope.
    /// console.time('walk.parents');
    ast.setParents();
    /// console.timeEnd('walk.parents');

    /// console.time('walk.scope');
    ast.walkBefore(function(ast) {
        ast.setScope()
    });
    /// console.timeEnd('walk.scope');

    //  1. Действие над каждой нодой в ast, не выходящее за рамки этой ноды и ее state/scope/context.
    /// console.time('walk.action');
    ast.walkAfter(function(ast) {
        ast.action();
    });
    /// console.timeEnd('walk.action');

    //  2. Оптимизация дерева. Группировка нод, перестановка, замена и т.д.
    /// ast.trigger('optimize');

    //  3. Валидация. Проверяем типы, определенность переменных/функций и т.д.
    /// console.time('walk.validate');
    ast.walkBefore(function(ast) {
        ast.validate();
    });
    /// console.timeEnd('walk.validate');

    /// console.time('walk.types');
    ast.walkBefore(function(ast) {
        ast.setTypes();
    });
    /// console.timeEnd('walk.types');

    //  Важно! Только после этого момента разрешается вызывать метод type() у нод.
    //  В фазах 0-3 он никогда не должен вызываться.

    //  4. Вытаскиваем определения (vars, funcs, jpaths, predicates, keys) в правильном порядке.
    /// console.time('walk.defs');
    ast.walkAfter(function(ast) {
        ast.extractDefs();
    });
    /// console.timeEnd('walk.defs');

    //  5. Подготовка к кодогенерации.
    /// console.time('walk.prepare');
    ast.walkBefore(function(ast) {
        ast.prepare();
    });
    /// console.timeEnd('walk.prepare');

    /// console.time('walk.transform');
    ast.walkAfter(function(ast, params, pKey, pObject) {
        if (pObject) {
            var ast_ = ast.transform();
            if (ast_) {
                pObject[pKey] = ast_;
            }
        }
    });
    /// console.timeEnd('walk.transform');

    return ast;
};

yate.compile = function(filename) {
    // console.timeEnd('walking');

    /// console.time('parse');
    var ast = yate.parse(filename);
    /// console.timeEnd('parse');

    /// console.time('walk');
    ast = yate.walk(ast);
    /// console.timeEnd('walk');

    /// console.time('js');
    var js = ast.js();
    /// console.timeEnd('js');

    return js;
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
    js += yate.compile( yate_filename );

    js += 'var data = ' + getData(data) + ';';

    mode = mode || '';
    js += 'yr.run("main", data, "' + mode + '");';

    var result = vm_.runInNewContext(js, {
        console: console
    });

    function getData(o) {
        if (o.filename) {
            return fs_.readFileSync(o.filename, 'utf-8');
        }
        return JSON.stringify(o.data);
    }

    return result;
};

// ----------------------------------------------------------------------------------------------------------------- //

module.exports = yate;

//  ---------------------------------------------------------------------------------------------------------------  //

