var fs_ = require('fs');
var path_ = require('path');
var vm_ = require('vm');

//  ---------------------------------------------------------------------------------------------------------------  //

var pt = require('parse-tools');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./factory.js');
require('./grammar.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate actions
//  ---------------------------------------------------------------------------------------------------------------  //

yate.parse = function(filename) {
    var parser = new pt.Parser(yate.grammar, yate.factory);

    var yastFilename = filename.replace(/\.yate$/, '.yate.ast');

    var ast;

    if ( path_.existsSync(yastFilename) ) {
        if ( fs_.statSync(filename).mtime < fs_.statSync(yastFilename).mtime ) {
            var yast = JSON.parse( fs_.readFileSync(yastFilename, 'utf-8') );

            if (yast.version === yate.version) {
                ast = yate.AST.deserialize(yast);
                return ast;
            }
        }
    }

    try {
        ast = parser.parse(filename, 'module');

        if ( yate.cliOptions['write-ast'] ) {
            fs_.writeFileSync(yastFilename, yate.AST.serialize(ast), 'utf-8');
        }

    } catch (e) {
        if (e instanceof pt.Parser.Error) {
            throw e.toString();
        } else {
            throw e;
        }

    }

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.walk = function(ast, filename) {

    //  Фазы-проходы по дереву:

    /// console.time('walking');

    ast.walkBefore(function(ast) {
        ast.w_deinclude();
    });

    //  0. Каждой ноде выставляется поле parent,
    //  кроме того, создается (или наследуются от parent'а) scope.
    /// console.time('walk.parents');
    ast.w_setParents();
    /// console.timeEnd('walk.parents');

    /// console.time('walk.scope');
    ast.walkBefore(function(ast) {
        ast.p.Rid = 0;
        ast.p.Cid = 0;

        ast.setScope()
    });
    /// console.timeEnd('walk.scope');

    //  1. Действие над каждой нодой в ast, не выходящее за рамки этой ноды и ее state/scope/context.
    /// console.time('walk.action');
    ast.walkAfter(function(ast) {
        ast.w_action();
    });
    /// console.timeEnd('walk.action');

    //  2. Оптимизация дерева. Группировка нод, перестановка, замена и т.д.
    /// ast.trigger('optimize');

    //  3. Валидация. Проверяем типы, определенность переменных/функций и т.д.
    /// console.time('walk.validate');
    ast.walkBefore(function(ast) {
        ast.w_validate();
    });
    /// console.timeEnd('walk.validate');

    /// console.time('walk.types');
    ast.walkBefore(function(ast) {
        ast.w_setTypes();
    });
    /// console.timeEnd('walk.types');

    //  Важно! Только после этого момента разрешается вызывать метод getType() у нод.
    //  В фазах 0-3 он никогда не должен вызываться.

    //  4. Вытаскиваем определения (vars, funcs, jpaths, predicates, keys) в правильном порядке.
    /// console.time('walk.defs');
    ast.walkAfter(function(ast) {
        ast.w_extractDefs();
    });
    /// console.timeEnd('walk.defs');

    if (ast.p.Name) {
        var yobjFilename = filename.replace(/\.yate$/, '.yate.obj');
        var a = [];
        ast.p.Block.scope.defs.forEach(function(def) {
            if ( def.is('var_') || def.is('function_') || def.is('key') || def.is('external') ) {
                a.push( yate.AST.toJSON(def) );
            }
        });
        var obj = {
            version: yate.version,
            filename: filename,
            name: ast.p.Name,
            defs: a
        };
        fs_.writeFileSync(yobjFilename, JSON.stringify(obj), 'utf-8');
    }

    //  5. Подготовка к кодогенерации.
    /// console.time('walk.prepare');
    ast.walkBefore(function(ast) {
        ast.w_prepare();
    });
    /// console.timeEnd('walk.prepare');

    /// console.time('walk.transform');
    ast.walkAfter(function(ast, params, pKey, pObject) {
        if (pObject) {
            var ast_ = ast.w_transform();
            if (ast_) {
                pObject[pKey] = ast_;
            }
        }
    });
    /// console.timeEnd('walk.transform');

    /// console.timeEnd('walking');

    return ast;
};

yate.compile = function(filename) {
    /// console.time('parse');
    var ast = yate.parse(filename);
    /// console.timeEnd('parse');

    /// console.time('walk');
    ast = yate.walk(ast, filename);
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

