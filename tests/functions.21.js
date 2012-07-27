yr.externals.contains = function(m, c0, a0, index, count, nodeset, scalar) {
    var r = [];
    for (var i = 0; i < nodeset.length; i++) {
        var node = nodeset[i];
        if (scalar.indexOf( m.nodeValue(node) ) > -1) {
            r.push(node);
        }
    }
    return r;
};

