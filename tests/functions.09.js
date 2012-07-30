yr.externals.reverse = function(nodeset) {
    var r = [];
    for (var i = nodeset.length; i--;) {
        r.push( nodeset[i] );
    }
    return r;
};

