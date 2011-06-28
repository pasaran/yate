Yate.AST.argList.defaults = function() {
    var r = [];
    this.iterate(function(arg) {
        if (arg.Default) {
            r.push(arg._js('argListItemDefault'));
        }
    });
    return r.join('\n');
};

