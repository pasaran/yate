Yater.externals = {

    contains: function(c0, a0, index, count, nodeset, scalar) {
        var r = [];
        for (var i = 0; i < nodeset.length; i++) {
            if (scalar.indexOf(nodeset[i]) > -1) {
                r.push( nodeset[i] );
            }
        }
        return r;
    }

};
