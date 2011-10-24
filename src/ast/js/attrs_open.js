/*
yate.AST.openAttrs.js = function() {
    this.Attrs.trigger('set', 'mode', '');

    r = 'r' + this.Rid + '.attrs = {\n';
    this.Attrs.iterate(function(attr, i) {
        if (i) { r += ',\n'; }
        r += '    ' + JSON.stringify(attr.Name) + ': ' + attr.Value.js();
    });
    r += '\n};\n';
    r += 'r' + this.Rid + '.open = true;';
    return r;
};
*/
