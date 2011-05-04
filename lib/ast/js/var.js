Yate.AST.var_.js = function() {
    var value = this.$value;

    // FIXME: Ужос какой-то. Все переделать!

    if (value.is([ 'inlineList', 'inlineExpr' ])) {
        return this._js();
    }

    var name = 'v' + this.$vid;
    value.trigger(function() {
        this.$rid++;
        this.role = 'var';
        this.$varname = name;
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

    return this._js('varBlock');
};

