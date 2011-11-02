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

yate.AST.string_literal._type = yate.types.SCALAR;

yate.AST.string_literal.toResult = function(result) {
    if (this.mode === 'attr') {
        result.push(yate.quoteAttr(this.Value));
    } else if (this.mode === 'text') {
        result.push(yate.quoteText(this.Value));
    } else {
        result.push(this.Value);
    }
};

