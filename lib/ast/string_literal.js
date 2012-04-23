var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.string_literal = {};

AST.string_literal.options = {
    base: 'inline_expr'
};

AST.string_literal._init = function(s) {
    this.Value = s;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codetemplates.js
AST.string_literal.yate = function() {
    return this.Value;
};

AST.string_literal._type = 'scalar';

AST.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.Value = yate.quoteAttr(this.Value);
    } else if (to === 'xml') {
        this.Value = yate.quoteText(this.Value);
    }

    return false;
};

AST.string_literal.stringify = function() {
    return JSON.stringify( this.Value );
};

AST.string_literal.asString = function() {
    return this.Value;
};

