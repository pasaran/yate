Yate.AST.attr.js = function() {
    var expr = this.$expr;

    // FIXME: Ужос какой-то. Все переделать!

    if (expr.is([ 'inlineList', 'inlineExpr' ])) {
        return this._js();
    }

    expr.trigger(function() {
        this.$rid++;
        this.role = 'output';
    });

    /*
    var type = value.type();
    if (type === Yate.Types.NODESET || type === Yate.Types.BOOLEAN) {
        return this._js('varInline');
    }

    if (value.is([ 'blockComplex', 'if_', 'for_', 'apply' ])) {
        return this._js('varBlock');
    }
    */

    return this._js('attrBlock');
};

