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

yate.AST.inline_expr.codedata$ = function(lang) {
    if (this.AsType && lang !== 'yate') {
        var cast = yate.AST.make('cast', this.AsType, this);
        this.AsType = null; // Чтобы не зациклиться (cast.js() вызызовет inline_expr.js()), снимаем флаг о том,
                            // что нужно преобразование типов.
        return cast;
    } else {
        return this;
    }
};

yate.AST.inline_expr.code$output = function() {
    return this.js('inline_output');
};

yate.AST.inline_expr.closes = function() {
    return ( this.type() != yate.types.ATTR ); // Если тип атрибут, то после него все еще могут быть другие атрибуты.
};

/*
yate.AST.inline_expr.transform = function() {
    if (this.AsType) {
        return this.make('cast', this.AsType, this);
    }
};
*/

