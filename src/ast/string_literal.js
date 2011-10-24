yate.AST.string_literal = {

    options: {
        base: 'inline_expr'
    },

    _init: function(s) {
        this.Value = s;
    },

    // Чтобы при выводе не отрезались начальные и конечные пробелы.
    // См. ../codetemplates.js +193
    yate: function() {
        return this.Value;
    },

    _type: yate.types.SCALAR,

    toResult: function(result) {
        if (this.mode === 'attr') {
            result.push(yate.quoteAttr(this.Value));
        } else if (this.mode === 'text') {
            result.push(yate.quoteText(this.Value));
        } else {
            result.push(this.Value);
        }
    }

};

