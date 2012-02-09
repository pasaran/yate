// ----------------------------------------------------------------------------------------------------------------- //

yate.parse = function(filename) {
    var parser = new yate.Parser(yate.grammar);
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

    // console.time('codegen');
    var js = yate.codetemplates.fill('js', 'main', '', {
        Stylesheet: ast,
        Module: module || 'default'
    });
    // console.timeEnd('codegen');

    return js;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.run = function(yate_filename, data_filename, ext_filename) {

    var fs = require('fs');
    var vm = require('vm');


    // Читаем runtime.
    var js = fs.readFileSync( __dirname + '/src/runtime.js', 'utf-8');

    // Добавляем внешние функции, если есть.
    if (ext_filename) {
        js += fs.readFileSync( ext_filename, 'utf-8' );
    }

    // Добавляем скомпилированные шаблоны.
    js += yate.compile( yate_filename );

    js += 'var data = ' + fs.readFileSync( data_filename, 'utf-8' ) + ';';

    js += 'Yater.run(data);';

    var result = vm.runInNewContext(js, {
        console: console
    });

    return result;
};

// ----------------------------------------------------------------------------------------------------------------- //

