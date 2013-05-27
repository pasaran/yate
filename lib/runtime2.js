var yr = {};

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Module = function() {

};

yr.Module.prototype.doc = function(data) {
    return new yr.Doc(data, this);
};

//  NOTE: ex applyValue.
yr.Module.prototype.applyValue = function(M, nodeset, mode, a0) {
    var r = '';
    var l0 = nodeset.length;
    if (!l0) {
        return r;
    }

    //  Достаем аргументы, переданные в apply, если они там есть.
    var args;
    var n_args = arguments.length;
    if (n_args > 6) {
        args = Array.prototype.slice.call(arguments, 6);
    }

    var imports = M.imports;

    //  Идем по нодесету.
    for (var i0 = 0; i0 < l0; i0++) {
        var c0 = nodeset[i0];

        //  Для каждой ноды ищем подходящий шаблон.
        //  Сперва ищем в текущем модуле ( imports[0] ),
        //  затем идем далее по списку импортов.

        //  Если мы найдем шаблон, в found будет его id, а в module -- модуль,
        //  в котором находится этот шаблон.
        var found = false;
        var module;

        var i2 = 0;
        var l2 = imports.length;
        while (!found && i2 < l2) {
            module = imports[i2++];

            //  matcher представляем собой двухуровневый объект,
            //  на первом уровне ключами являются моды,
            //  на втором -- имена нод.
            //  Значения на втором уровне -- список id-шников шаблонов.
            var names = module.matcher[mode];

            if (names) {
                //  FIXME: Тут неправильно. Если шаблоны для c0.name будут,
                //  но ни один из них не подойдет, то шаблоны для '*' не применятся вообще.
                //  FIXME: Плюс шаблоны на '*' всегда имеют более низкий приоритет.
                var templates = names[c0.name] || names['*'];
                if (templates) {
                    var i3 = 0;
                    var l3 = templates.length;
                    while (!found && i3 < l3) {
                        var tid = templates[i3++];
                        var template = module[tid];

                        var selector = template.j;
                        if (selector) {
                            //  В template.j лежит id селектора (jpath'а).
                            //  В tempalte.a флаг о том, является ли jpath абсолютным.
                            if ( module.matched(selector, template.a, c0, i0, l0) ) {
                                found = tid;
                            }
                        } else {
                            var selectors = template.s;
                            var abs = template.a;
                            //  В template.s лежит массив с id-шниками селекторов.
                            for (var i4 = 0, l4 = selectors.length; i4 < l4; i4++) {
                                if ( module.matched(selectors[i4], abs[i4], c0, i0, l0) ) {
                                    found = tid;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (found) {
            //  Шаблон нашли, применяем его.
            //  FIXME: Сравнить скорость с if-else.
            switch (n_args) {
                case 4:
                    r += template( M, c0, i0, l0, a0 );
                    break;
                case 5:
                    r += template( M, c0, i0, l0, a0, arguments[4] );
                    break;
                case 6:
                    r += template( M, c0, i0, l0, a0, arguments[4], arguments[5] );
                    break;
                default:
                    //  Шаблон позвали с параметрами, приходится изгаляться.
                    //  FIXME: Тут переопределение this не нужно вообще.
                    r += template.apply( M, [M, c0, i0, l0, a0].concat(args) );
            }
        }
    }

    return r;
};
//  ---------------------------------------------------------------------------------------------------------------  //

yr.Doc = function(data, module) {
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

//  ---------------------------------------------------------------------------------------------------------------  //

yr.scalarStep = function(name) {

};

yr.booleanStep = function(name) {

};

yr.xmlStep = function(name) {

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

function escape1(s) {
    return s.replace(/&/g, '&amp;');
}

function escape4(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

function escape3(s) {
    return s
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Attrs = function() {
    this.attrs = {};
    this.name = '';
};

yr.Attrs.prototype.add = function(name, value) {
    this.attrs[name] = value;
};

var shortTags = yr.shortTags = {
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    wbr: true
};

yr.Attrs.prototype.close = function() {
    var name = this.name;

    var r = '';
    if (name) {
        var attrs = this.attrs;

        for (var attr in attrs) {
            r += ' ' + attr + '="' + attrs[attr].quote() + '"';
        }
        r += ( shortTags[name] ) ? '/>' : '>';

        this.name = '';
    }

    return r;
};

yr.Attrs.prototype.copy = function(to) {
    to = to || new yr.Attrs();

    var from_attrs = this.attrs;
    var to_attrs = to.attrs;

    for (var name in attrs) {
        to[name] = from[name];
    }

    to.name = this.name;

    return to;
};
//  ---------------------------------------------------------------------------------------------------------------  //

yr.scalarAttr = function(s) {
    this.s = (s == null) ? '' : s.toString();
};

yr.scalarAttr.prototype.quote = function() {
    return escape4(this.s);
};

yr.scalarAttr.prototype.add_xml = function(xml) {
    return new yr.xmlAttr( escape1(this.s) + xml );
};

yr.scalarAttr.prototype.add_scalar = function(xml) {
    return new yr.scalarAttr( this.s + xml );
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.xmlAttr = function(s) {
    this.s = (s == null) ? '' : s.toString();
};

yr.xmlAttr.prototype.quote = function() {
    return escape3(this.s);
};

yr.xmlAttr.prototype.addscalar = function(scalar) {
    return new yr.xmlAttr( this.s + escape1(scalar) );
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

})();

//  ---------------------------------------------------------------------------------------------------------------  //

