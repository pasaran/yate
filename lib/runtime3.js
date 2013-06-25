var Doc = function(data) {
    this.root = {
        data: data,
        name: '',
        doc: this,
        parent: null
    };
};

function step_n(node, name, result) {
    var data = node.data;

    if (!data) { return result; }

    data = data[name];
    if (data === undefined) { return result; }

    var doc = node.doc;
    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            result.push({
                data: data[i],
                name: name,
                doc: doc,
                parent: node
            });
        }
    } else {
        result.push({
            data: data,
            name: name,
            doc: doc,
            parent: node
        });
    }

    return result;
}

function step(nodeset, name) {
    var result = [];

    var doc = nodeset[0].doc;
    for (var i = 0, l = nodeset.length; i < l; i++) {
        var node = nodeset[i];

        var data = node.data;

        if (!data) { continue; }

        data = data[name];
        if (data === undefined) { continue; }

        if (data instanceof Array) {
            for (var j = 0, m = data.length; j < m; j++) {
                result.push({
                    data: data[j],
                    name: name,
                    doc: doc,
                    parent: node
                });
            }
        } else {
            result.push({
                data: data,
                name: name,
                doc: doc,
                parent: node
            });
        }
        //  step_n( nodeset[i], name, result );
    }

    return result;
}

function filter(nodeset, filter) {
    var result = [];

    for (var i = 0, l = nodeset.length; i < l; i++) {
        var node = nodeset[i];
        if ( filter(node, i, l) ) {
            result.push(node);
        }
    }

    return result;
}

function boolean(nodeset) {
    if (!nodeset.length) {
        return false;
    }

    return !!nodeset[0].data;
};

function s_boolean(nodeset, name) {
    if (!nodeset.length) { return false; }

    var data = nodeset[0].data;
    if (!data) { return false; }

    var r = data[name];

    if (!r) { return false; }

    if (r instanceof Array) {
        return r.length;
    }

    return true;
};
