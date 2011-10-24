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

    _type: yate.Types.SCALAR,

    toResult: function(result) {
        if (this.mode === 'attr') {
            result.push(yate.Common.quoteAttr(this.Value));
        } else if (this.mode === 'text') {
            result.push(yate.Common.quoteText(this.Value));
        } else {
            result.push(this.Value);
        }
    }

};

