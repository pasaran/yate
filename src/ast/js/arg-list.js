Yate.AST.arglist.defaults = function() {
    var r = [];
    this.iterate(function(arg) {
        if (arg.Default) {
            r.push(arg._js('arglist_item_default'));
        }
    });
    return r.join('\n');
};

