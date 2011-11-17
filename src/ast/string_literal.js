yate.AST.string_literal = {};

yate.AST.string_literal.options = {
    base: 'inline_expr'
};

yate.AST.string_literal._init = function(s) {
    this.Value = s;
};

// Чтобы при выводе не отрезались начальные и конечные пробелы.
// См. codetemplates.js
yate.AST.string_literal.yate = function() {
    return this.Value;
};

yate.AST.string_literal._type = 'scalar';

yate.AST.string_literal.oncast = function(to) {
    if (to === 'attrvalue') {
        this.Value = yate.quoteAttr(this.Value);
    } else if (to === 'xml') {
        this.Value = yate.quoteText(this.Value);
    }

    return false;
};

yate.AST.string_literal.stringify = function() {
    return JSON.stringify( this.Value );
};

