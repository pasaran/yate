Yate.AST.function_.js = function() {
    var type = this.$body.type();

    this.$body.trigger(function() {
        this.role = 'var';
        this.$varname = 'r';
    });
    this.$body.role = 'return';

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
        if (arg.$default) {
            r.push(arg._js('argListItemDefault'));
        }
    });
    return r.join('\n');
};

