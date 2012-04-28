var fs_ = require('fs');
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
    parser.read(filename);

    // console.time('parse');
    var ast = parser.match('stylesheet');
    // console.timeEnd('parse');

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.walk = function(ast) {

    // Фазы-проходы по дереву:

    // console.time('walking');

    // 0. Каждой ноде выставляется поле parent,
    //    кроме того, создается (или наследуются от parent'а) scope.
    ast.setParents();

    ast.walkBefore(function(ast) {
        ast.setScope()
    });

    // 1. Действие над каждой нодой в ast, не выходящее за рамки этой ноды и ее state/scope/context.
    ast.walkBefore(function(ast) {
        ast.action();
    });

    // 2. Оптимизация дерева. Группировка нод, перестановка, замена и т.д.
    // ast.trigger('optimize');

    // 3. Валидация. Проверяем типы, определенность переменных/функций и т.д.
    ast.walkBefore(function(ast) {
        ast.validate();
    });

    ast.walkBefore(function(ast) {
        ast.setTypes();
    });

    // Важно! Только после этого момента разрешается вызывать метод type() у нод.
    // В фазах 0-3 он никогда не должен вызываться.

    // 4. Вытаскиваем определения (vars, funcs, jpaths, predicates, keys) в правильном порядке.
    ast.walkAfter(function(ast) {
        ast.extractDefs();
    });

    // 5. Подготовка к кодогенерации.
    ast.walkBefore(function(ast) {
        ast.prepare();
    });

    ast.walkAfter(function(ast, params, pKey, pObject) {
        if (pKey && pObject) {
            var ast_ = ast.transform();
            if (ast_) {
                pObject[pKey] = ast_;
            }
        }
    });

    return ast;
};

yate.compile = function(filename, module) {
    // console.timeEnd('walking');

    var ast = yate.parse(filename);
    ast = yate.walk(ast);
    ast.Module = module || 'default';

    return ast.js();
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.run = function(yate_filename, data_filename, ext_filename, mode) {

    // Читаем runtime.
    var js = fs_.readFileSync( __dirname + '/../lib/yate-runtime.js', 'utf-8');

    // Добавляем внешние функции, если есть.
    if (ext_filename) {
        js += fs_.readFileSync( ext_filename, 'utf-8' );
    }

    // Добавляем скомпилированные шаблоны.
    js += yate.compile( yate_filename );

    js += 'var data = ' + fs_.readFileSync( data_filename, 'utf-8' ) + ';';

    mode = mode || '';
    js += 'Yater.run(data, null, "' + mode + '");';

    var result = vm_.runInNewContext(js, {
        console: console
    });

    return result;
};

// ----------------------------------------------------------------------------------------------------------------- //

module.exports = yate;

//  ---------------------------------------------------------------------------------------------------------------  //

