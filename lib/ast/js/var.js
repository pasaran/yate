/*
Yate.AST.var_.js = function() {
    var value = this.Value;

    // FIXME: Ужос какой-то. Все переделать!

    if (value.is([ 'inlineList', 'inlineExpr' ])) {
        return this._js();
    }

    var name = 'v' + this.Vid;
    value.trigger(function() {
        this.Rid++;
        this.role = 'var';
        this.Varname = name;
    });

    return this._js('varBlock');
};
*/
