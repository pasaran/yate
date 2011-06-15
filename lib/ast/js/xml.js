/*
Yate.AST.blockList.js = function() {
    var items = [];
    this.toResult(items);

    var r = [];
    var s = '';
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (typeof item == 'string') {
            s += item;
        } else {
            if (s) {
                r.push(s);
                s = '';
            }
            r.push(item);
        }
    }
    if (s) {
        r.push(s);
    }

    for (var i = 0, l = r.length; i < l; i++) {
        var item = r[i];
        if (typeof item == 'string') {
            r[i] = Yate.Common.quote(item);
        } else {
            r[i] = item.js();
        }
    }

    return r.join(' + ');
};
*/

Yate.AST.openAttrs.js = function() {
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
