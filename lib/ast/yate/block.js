Yate.AST.blockExprs.yate = function() {
    var exprs = [];
    var indent = 0;

    // XML indents

    this.iterate(function(expr) {
        var delta = 0;
        if (expr.is('xmlLine')) {
            expr.iterate(function(item) {
                if (item.is('xmlStart')) {
                    delta++;
                } else if (item.is('xmlEnd')) {
                    delta--;
                }
            });
        }
        if (delta < 0) indent--;
        exprs.push( expr.yate().replace(/^/gm, Array(indent + 1).join('    ')) );
        if (delta > 0) indent++;
    });

    return exprs.join('\n');
};

Yate.AST.blockTemplates.options.yate = {
    separator: '\n\n'
};

Yate.AST.blockDefs.options.yate = {
    separator: '\n\n'
};

Yate.AST.argList.options.yate = {
    separator: ', '
};

