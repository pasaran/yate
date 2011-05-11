Yate.AST.function_.js = function() {
    var type = this.Body.type();

    this.Body.trigger(function() {
        this.role = 'var';
        this.Varname = 'r';
    });
    this.Body.role = 'return';

    return this._js('function_');
};

Yate.AST.argList.options.js = {
    separator: ', '
};

Yate.AST.callArgs.options.js = {
    separator: ', '
};

Yate.AST.argList.defaults = function() {
    var r = [];
    this.iterate(function(arg) {
        if (arg.Default) {
            r.push(arg._js('argListItemDefault'));
        }
    });
    return r.join('\n');
};

