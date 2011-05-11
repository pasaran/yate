var parser = Yate.Parser;

parser.init(Yate.Grammar);
parser.open({ filename: process.argv[2] });

var ast = parser.match('stylesheet');

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

/*
var astKeys = {};
ast.trigger(function() {
    for (var key in this) {
        astKeys[key] = true;
    }
});
console.log(Yate.Common.keys(astKeys).sort().join('\n'));
*/

var runtime = require('fs').readFileSync(__dirname + '/lib/runtime.js', 'utf-8');

console.log(Yate.CodeTemplates.fill('js', 'main', {
    Runtime: runtime,
    Stylesheet: ast
}, 'js'));

/*
*/

