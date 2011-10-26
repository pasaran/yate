yate.AST.block_exprs.js$ = function() {
    var mode = (this.AsList) ? 'listitem' : 'output';

    var r = [];
    this.iterate(function(item) {
        r.push( item.js(mode) );
    });
    return r.join('\n');
};

