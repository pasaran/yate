yate.AST.block_exprs.js = function() {
    var params = {
        mode: (this.AsList) ? 'listitem' : 'output'
    };

    var r = [];
    this.iterate(function(item) {
        r.push( item._js(params) );
    });
    return r.join('\n');
};
