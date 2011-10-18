Yate.AST.inline_expr = {

    options: {
        base: 'expr'
    },

    toResult: function(result) {
        if (this.mode) { // FIXME: А не нужно ли тут еще какого-нибудь условия?
            result.push( this.make('quote', this, this.mode) );
        } else {
            result.push(this);
        }
    },

    inline: function() {
        return true;
    }

};

