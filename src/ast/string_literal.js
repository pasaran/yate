Yate.AST.string_literal = {

    options: {
        base: 'inline_expr'
    },

    _init: function(s) {
        this.Value = s;
    },

    _type: Yate.Types.SCALAR,

    toResult: function(result) {
        if (this.mode === 'attr') {
            result.push(Yate.Common.quoteAttr(this.Value));
        } else if (this.mode === 'text') {
            result.push(Yate.Common.quoteText(this.Value));
        } else {
            result.push(this.Value);
        }
    }

};

