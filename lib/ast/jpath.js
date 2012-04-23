var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.jpath = {};

AST.jpath.options = {
    base: 'inline_expr'
};

AST.jpath._type = 'nodeset';

AST.jpath.isLocal = yate.true;

AST.jpath.validate = function() {
    var context = this.Context;
    if (context && !context.type( 'nodeset' )) {
        context.error('Invalid type. Should be NODESET');
    }
};

// oncast = function() {},

// Возвращаем значение последнего nametest'а или же ''.
// Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
AST.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.Steps.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if (step.is('jpath_nametest')) {
            return step.Name;
        }
    }
    return '';
};

AST.jpath.getScope = function() {
    return this.Steps.getScope();
};

AST.jpath.extractDefs = function() {
    var key = this.yate(); // Каноническая запись jpath.

    var state = this.state;
    var scope = this.getScope(); // scope, в котором этот jpath имеет смысл.
                                 // Например, .foo.bar[ .count > a + b ] имеет смысл только внутри scope'а,
                                 // в котором определены переменные a и b.

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var jid = scope.jkeys[key];
    if (jid === undefined) {
        jid = scope.jkeys[key] = state.jid++;
        scope.defs.push(this);
    }

    this.Jid = jid; // Запоминаем id-шник.
    this.Key = key;
};

