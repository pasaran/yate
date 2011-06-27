/*
Yate.AST.attr.js = function() {
    var expr = this.Expr;

    // FIXME: Ужос какой-то. Все переделать!

    if (expr.is([ 'inlineList', 'inlineExpr' ])) {
        return this._js();
    }

    expr.trigger(function() {
        this.Rid++;
        this.role = 'output';
    });

    return this._js('attrBlock');
};
*/
