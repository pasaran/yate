Yate.AST.inlineFunction.js = function() {
    var type = this.def.Type;
    switch (type) {
        case Yate.AST.functionType.INTERNAL: return this._js('function_' + this.Name);
        case Yate.AST.functionType.KEY: return this._js('usekey');
        default: return this._js();
    }
};

Yate.AST.inlineString.js = function() {
    var r = [];
    this.toResult(r);

    for (var i = 0, l = r.length; i < l; i++) {
        var item = r[i];
        if (typeof item == 'string') {
            r[i] = Yate.Common.quote(item);
        } else {
            r[i] = item.js();
        }
    }
    return r.join(' + ');
};

