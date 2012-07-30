yr.externals.contains = function(nodeset, scalar) {
    var r = [];
    for (var i = 0; i < nodeset.length; i++) {
        var node = nodeset[i];
        if (scalar.indexOf( yr.nodeValue(node) ) > -1) {
            r.push(node);
        }
    }
    return r;
};

