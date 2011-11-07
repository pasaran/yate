// ----------------------------------------------------------------------------------------------------------------- //

yate.parse = function(filename) {
    var parser = yate.parser;

    parser.init( yate.grammar );

    parser.open({ filename: filename });

    // console.time('parse');
    var ast = parser.match('stylesheet');
    // console.timeEnd('parse');

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.compile = function(filename) {
    var ast = yate.parse(filename);

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

    // console.timeEnd('walking');

    var runtime = require('fs').readFileSync(__dirname + '/src/runtime.js', 'utf-8'); // FIXME: Не нужно runtime совать в генерируемый код.

    // console.time('codegen');
    var js = yate.codetemplates.fill('js', 'main', '', {
        Runtime: runtime,
        Stylesheet: ast
    });
    // console.timeEnd('codegen');

    return js;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.run = function(yate_filename, data_filename) {
    var js = yate.compile( yate_filename );
    var stylesheet = eval( '(' + js + ')' ); // FIXME: Заюзать vm.runInNewContext.

    var data = JSON.parse( require('fs').readFileSync( data_filename, 'utf-8' ) );

    var result = require('vm').runInNewContext('(stylesheet(data))', {
        data: data,
        stylesheet: stylesheet
    });

    return result;
};

// ----------------------------------------------------------------------------------------------------------------- //

