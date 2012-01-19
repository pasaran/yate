yate.AST.inline_string = {};

yate.AST.inline_string.options = {
    base: 'inline_expr'
};

yate.AST.inline_string._type = 'scalar';

yate.AST.inline_string.oncast = function(to) {
    this.Value.cast(to);

    return false;
};

yate.AST.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

yate.AST.inline_string.asString = function() {
    var s = '';

    var items = this.Value.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        s += item.asString();
    }

    return s;
};

