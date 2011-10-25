yate.AST.inline_expr = {};

yate.AST.inline_expr.options = {
    base: 'expr'
};

yate.AST.inline_expr.toResult = function(result) {
    if (this.mode) { // FIXME: А не нужно ли тут еще какого-нибудь условия?
        result.push( this.make('quote', this, this.mode) );
    } else {
        result.push(this);
    }
};

yate.AST.inline_expr.inline = yate.true;

yate.AST.inline_expr.codedata$ = function(o) {
    if (this.AsType) {
        var cast = yate.AST.make('cast', this.AsType, this);
        this.AsType = null; // Чтобы не зациклиться (cast.js() вызызовет inline_expr.js()), снимаем флаг о том,
                            // что нужно преобразование типов.
        return cast;
    } else {
        return this;
    }
};

