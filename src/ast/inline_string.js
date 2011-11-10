yate.AST.inline_string = {};

yate.AST.inline_string.options = {
    base: 'inline_expr'
};

yate.AST.inline_string._type = 'scalar';

yate.AST.inline_string.prepare = function() {
    this.Value.cast('scalar');
};

yate.AST.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

