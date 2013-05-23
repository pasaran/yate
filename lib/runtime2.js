var yr = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Doc = function(data) {
    this.root = new yr.Node(data, '', this);

    this._keys = {};
    this._vars = {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Node = function(data, name, doc, parent) {
    this.data = data;
    this.name = name;
    this.doc = doc;
    this.parent = parent || null;
};

yr.Node.prototype.child = function(data, name) {
    return new yr.Node(data, name, this.doc, this);
};

yr.Node.prototype.step = function(name, result) {
    result = result || ( new yr.Nodeset() );
    var data = this.data;

    //  FIXME: Кажется, тут можно и не проверять, что это объект.
    //  Т.к. следующая строчка для не объекта все равно даст undefined.
    if (!data || typeof data !== 'object') { return result; }

    data = data[name];
    if (data === undefined) { return result; }

    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            //  FIXME: Может быть быстрее будет явное new yr.Node?
            result.push( this.child( data[i], name ) );
        }
    } else {
        result.push( this.child( data, name ) );
    }

    return result;

};

yr.Node.prototype.star = function(result) {
    result = result || ( new yr.Nodeset() );

    var data = this.data;
    for (var name in data) {
        this.step(name, result);
    }

    return result;
};

yr.Node.prototype.dots = function(n, result) {
    var node = this;
    var i = 0;

    while (node && i < n) {
        node = node.parent;
        i++;
    }

    if (node) {
        result.push(node);
    }

    return result;
};

yr.Node.prototype.scalar = function() {
    var data = this.data;

    return (typeof data === 'object') ? '': data;
};

yr.Node.prototype.boolean = function() {
    return !!this.data;
};

yr.Node.prototype.xml = function() {

};

yr.Node.prototype.isEmpty = function() {
    return false;
};

/*
    steps:

    step    param       description
    ---------------------------------
    1       'foo'       nametest
    2       0           startest
    3       n           index
    4       n           dots
    5       p0          filter
    6       'p0'        filter by id
    7       p0          guard
    8       'p0'        guard by id

    var j0 = [ 1, 'foo' ];
    var j1 = [ 1, 'foo', 1, 'bar' ];

*/

yr.Node.prototype.select = function(jpath) {
    var result = this;

    for (var i = 0, l = jpath.length; i < l; i += 2) {
        var step = jpath[i];
        var param = jpath[i + 1];

        switch (step) {
            case 1:
                result = result.step(param);
                break;

            case 2:
                result = result.star();
                break;

            case 3:
                result = result.index(param);
                break;

            case 4:
                result = result.dots(param);
                break;

            case 5:
                result = result.filter(param);
                break;

            case 7:
                result = result.guard(param);
                break;
        }

        if ( result.isEmpty() ) {
            return result;
        }
    }

    return result;
};

yr.Node.prototype.matches = function(jpath, abs, index, count) {

    if (jpath === 1) {
        //  Это jpath '/'
        return !this.parent;
    }

    var l = jpath.length;
    //  i (и l) всегда будет четное.
    var i = l - 2;
    while (i >= 0) {
        if (!c0) { return false; }

        var step = jpath[i];
        //  Тут step может быть либо 0 (nametest), либо 2 (predicate).
        //  Варианты 1 (dots) и 3 (index) в jpath'ах в селекторах запрещены.
        switch (step) {
            case 0:
                //  Nametest.
                var name = jpath[i + 1];
                if (name !== '*' && name !== c0.name) { return false; }
                c0 = c0.parent;
                break;

            case 2:
            case 4:
                //  Predicate or guard.
                var predicate = jpath[i + 1];
                if ( !predicate(this, c0, i0, l0) ) { return false; }
                break;
        }

        i -= 2;
    }

    if (abs && c0.parent) {
        return false;
    }

    return true;
};

yr.scalarStep = function(name) {

};

yr.booleanStep = function(name) {

};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Nodeset = function(nodes) {
    this.nodes = nodes || [];
};

yr.Nodeset.prototype.isEmpty = function() {
    return (this.nodes.length === 0);
};

yr.Nodeset.prototype.push = function(node) {
    this.nodes.push(node);
};

yr.Nodeset.prototype.step = function(name, result) {
    result = result || ( new yr.Nodeset() );

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        nodes[i].step(name, result);
    }

    return result;
};

yr.Nodeset.prototype.star = function(result) {
    result = result || ( new yr.Nodeset() );

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        nodes[i].star(result);
    }

    return result;
};

yr.Nodeset.prototype.dots = function(n, result) {
    result = result || ( new yr.Nodeset() );

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        nodes[i].dots(n, result);
    }

    return result;
};

yr.Nodeset.prototype.index = function(index) {
    var node = this.nodes[index];

    var result = new yr.Nodeset();

    if (node) {
        result.push(node);
    }

    return result;
};

yr.Nodeset.prototype.filter = function(filter) {
    var result = new yr.Nodeset();

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i];
        if ( filter(node, i, l) ) {
            result.push(node);
        }
    }

    return result;
};

yr.Nodeset.prototype.guard = function(guard) {
    var nodes = this.nodes;

    if (nodes.length > 0) {
        if ( guard( nodes[0].doc.root ) ) {
            return this;
        }
    }

    return new yr.Nodeset();
};

yr.Nodeset.prototype.scalar = function() {
    return ( this.isEmpty() ) ? '' : this.nodes[0].scalar();
};

yr.Nodeset.prototype.boolean = function() {
    return !this.isEmpty() && this.nodes[0].boolean();
};

yr.Nodeset.prototype.toArray = function() {
    var result = [];

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        result.push( nodes[i].data );
    }

    return result;
};

yr.Nodeset.prototype.concat = function(nodeset) {
    return new yr.Nodeset( this.nodes.concat(nodeset.nodes) );
};

yr.Nodeset.prototype.name = function() {
    return ( this.isEmpty() ) ? '' : this.nodes[0].name;
};

yr.Nodeset.prototype.select = function(jpath) {
    var result = new yr.Nodeset();

    var nodes = this.nodes;
    for (var i = 0, l = nodes.length; i < l; i++) {
        result = result.concat( nodes[i].select(jpath) );
    }

    return result;
};


//  ---------------------------------------------------------------------------------------------------------------  //

/*
    steps:

    step    param       description
    ---------------------------------
    1       'foo'       nametest
    2       0           startest
    3       n           index
    4       n           dots
    5       p0          filter
    6       'p0'        filter by id
    7       p0          guard
    8       'p0'        guard by id
*/

/*

    [1,'foo',1,'bar']

    function(n){return n.s('foo').s('bar')}

yr.compileSelect = function(steps) {
    var r = '';

    for (var i = 0, l = steps.length; i += 2) {
        var step = steps[i];
        var param = steps[i + 1];

        switch (step) {
            case 1:
                r += 'r = r.step("' + param + '");';
                break;

            case 2:
                r += 'r = r.star();';
                break;

            case 3:
                r += 'r = r.index(' + param + ');';
                break;

            case 4:

            case 5:
            case 7:

            case 6:
            case 8:
        }

        r += 'if ( node.isEmpty() ) { return node; }';
    }
};

yr.compileMatch = function(steps) {

};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

