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

