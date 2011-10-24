require('./colors.js');

var parser = yate.Parser;

var Fs = require('fs');
var CodeTemplates = require('./src/codetemplates.js').CodeTemplates;

parser.init(yate.Grammar);
parser.open({ filename: process.argv[2] });

var ast = parser.match('stylesheet');

// console.log(CodeTemplates.fill('yate', 'stylesheet', '', ast, 'yate'));

// console.log( require('util').inspect(ast, true, null) );

// ast.trigger('log');

// Фазы-проходы по дереву:

// 0. Каждой ноде выставляется поле parent,
//    кроме того, создаются (или наследуются от parent'а) т.н. locals -- state, scope, context.
ast.setParents();
ast.trigger('setLocals');

// 1. Действие над каждой нодой в ast, не выходящее за рамки этой ноды и ее state/scope/context.
ast.trigger('action');

// console.log( require('util').inspect(ast, true, null) );
// 2. Оптимизация дерева. Группировка нод, перестановка, замена и т.д.
ast.trigger('optimize');

// 3. Валидация. Проверяем типы, определенность переменных/функций и т.д.
ast.trigger('validate');

// Важно! Только после этого момента разрешается вызывать метод type() у нод.
// В фазах 0-3 он никогда не должен вызываться.

// 4. Подготовка к кодогенерации.
ast.trigger('prepare');

// ast.trigger('log');
// console.log( require('util').inspect(ast, true, null) );
// console.log(ast.yate());

var runtime = Fs.readFileSync(__dirname + '/src/runtime.js', 'utf-8');

process.stdout.write( CodeTemplates.fill('js', 'main', '', {
    Runtime: runtime,
    Stylesheet: ast
}, 'js') );

// console.log(ast.toString(), '\n\n');

