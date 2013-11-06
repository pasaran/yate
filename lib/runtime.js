//  ---------------------------------------------------------------------------------------------------------------  //
//  yate runtime
//  ---------------------------------------------------------------------------------------------------------------  //

var yr = {};

(function() {

yr.log = function() {};

//  TODO:
//  Пустой массив. Можно использовать везде, где предполается,
//  что он read-only. Например, когда из select() возвращается пустой нодесет и т.д.
//  var emptyA = [];

var modules = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Кешируем регулярки для лучшей производительности.
//  (http://jsperf.com/entityify-test/2)
//
var RE_AMP = /&/g;
var RE_LT = /</g;
var RE_GT = />/g;
var RE_QUOTE = /"/g;

var RE_E_AMP = /&amp;/g;
var RE_E_LT = /&lt;/g;
var RE_E_GT = /&gt;/g;

yr.text2xml = function(s) {
    if (s == null) { return ''; }

    //  NOTE: Странное поведение Safari в этом месте.
    //  Иногда сюда попадает объект, которые != null, но при этом у него
    //  нет метода toString. По идее, такого быть просто не может.
    //  Попытки пронаблюдать этот объект (при помощи console.log и т.д.)
    //  приводят к тому, что он "нормализуется" и баг пропадает.
    //  Вообще, любые операции, которые неявно приводят его к строке, например,
    //  тоже приводят к нормализации и пропаданию бага.
    //
    //  Поэтому, вместо `s.toString()` используем `('' + s)`.
    //
    return ('' + s)
        .replace(RE_AMP, '&amp;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;');
};

yr.xml2text = function(s) {
    //  NOTE: См. коммент про Safari выше.

    if (s == null) { return ''; }

    return ('' + s)
        .replace(RE_E_LT, '<')
        .replace(RE_E_GT, '>')
        .replace(RE_E_AMP, '&');
};

yr.text2attr = function(s) {
    //  NOTE: См. коммент про Safari выше.

    if (s == null) { return ''; }

    return ('' + s)
        .replace(RE_AMP, '&amp;')
        .replace(RE_QUOTE, '&quot;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;');
};

yr.xml2attr = function(s) {
    //  NOTE: См. коммент про Safari выше.

    if (s == null) { return ''; }

    return ('' + s)
        .replace(RE_QUOTE, '&quot;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;');
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.register = function(id, module) {
    if ( modules[id] ) {
        throw Error('Module "' + id + '" already exists');
    }

    //  Резолвим ссылки на импортируемые модули.

    var ids = module.imports || [];
    /// module.id = id;
    //  Для удобства добавляем в imports сам модуль.
    var imports = [ module ];
    for (var i = 0, l = ids.length; i < l; i++) {
        var module_ = modules[ ids[i] ];
        if (!module_) {
            throw Error('Module "' + ids[i] + '" doesn\'t exist');
        } else {
            imports = imports.concat(module_.imports);
        }
    }
    //  В результате мы дерево импортов превратили в плоский список.
    module.imports = imports;

    modules[id] = module;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.run = function(id, data, mode) {
    mode = mode || '';

    var module = modules[id];
    if (!module) {
        throw 'Module "' + id + '" is undefined';
    }

    var doc = new Doc(data);

    var r = module.a(module, [ doc.root ], mode, { a: {} } );

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.join = function join(left, right) {
    return left.concat(right);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.nodeValue = function nodeValue(node) {
    var data = node.data;
    return (typeof data === 'object') ? '': data;
};

yr.nodeName = function nodeName(nodeset) {
    var node = nodeset[0];

    return (node) ? node.name : '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.simpleScalar = function simpleScalar(name, context) {
    var data = context.data;
    if (!data) { return ''; }

    if (name === '*') {
        for (var key in data) {
            return yr.simpleScalar(key, context);
        }
        return '';
    }

    var r = data[name];

    if (typeof r === 'object') {
        return '';
    }

    return (r === undefined) ? '' : r;
};

yr.simpleBoolean = function simpleBoolean(name, context) {
    var data = context.data;
    if (!data) { return false; }

    if (name === '*') {
        for (var key in data) {
            var r = yr.simpleBoolean(key, context);
            if (r) { return true; }
        }
        return false;
    }

    var r = data[name];

    if (!r) { return false; }

    if (r instanceof Array) {
        return r.length;
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.nodeset2scalar = function nodeset2scalar(nodeset) {
    if (!nodeset.length) { return ''; }

    var data = nodeset[0].data;
    return (typeof data == 'object') ? '': data;
};

yr.nodeset2boolean = function nodeset2boolean(nodeset) {
    if (! (nodeset && nodeset.length > 0) ) {
        return false;
    }

    return !!nodeset[0].data;
};

yr.nodeset2xml = function nodeset2xml(nodeset) {
    return yr.scalar2xml( yr.nodeset2scalar(nodeset) );
};

yr.nodeset2attrvalue = function nodeset2attrvalue(nodeset) {
    return yr.scalar2attrvalue( yr.nodeset2scalar(nodeset) );
};

yr.scalar2xml = yr.text2xml;
yr.xml2scalar = yr.xml2text;

//  FIXME: Откуда вообще взялась идея, что xml в атрибуты нужно кастить не так, как скаляры?!
//  Смотри #157. Не нужно квотить амперсанд, потому что он уже заквочен.
yr.xml2attrvalue = yr.xml2attr;

yr.scalar2attrvalue = yr.text2attr;

yr.object2nodeset = function object2nodeset(object) {
    return [ ( new Doc(object) ).root ];
};

yr.array2nodeset = function array2nodeset(array) {
    var object = {
        'item': array
    };
    return [ ( new Doc(object) ).root ];
};

//  Сравниваем скаляр left с нодесетом right.
yr.cmpSN = function cmpSN(left, right) {
    for (var i = 0, l = right.length; i < l; i++) {
        if ( left == yr.nodeValue( right[i] ) ) {
            return true;
        }
    }
    return false;
};

//  Сравниваем два нодесета.
yr.cmpNN = function cmpNN(left, right) {
    var m = right.length;

    if (m === 0) { return false; }
    if (m === 1) { return yr.cmpSN( yr.nodeValue( right[0] ), left ); }

    var values = [];

    var rv = yr.nodeValue( right[0] );
    for (var i = 0, l = left.length; i < l; i++) {
        var lv = yr.nodeValue( left[i] );
        if (lv == rv) { return true; }
        values[i] = lv;
    }

    for (var j = 1; j < m; j++) {
        rv = yr.nodeValue( right[j] );
        for (var i = 0, l = left.length; i < l; i++) {
            if ( values[i] == rv ) { return true; }
        }
    }

    return false;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.shortTags = {
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

yr.closeAttrs = function closeAttrs(a) {
    var name = a.s;

    if (name) {
        var r = '';
        var attrs = a.a;

        for (var attr in attrs) {
            r += ' ' + attr + '="' + attrs[attr].quote() + '"';
        }
        /*
        for (var attr in attrs) {
            if ( attrs.hasOwnProperty(attr) ) {
                var v = attrs[attr];
                if (v.quote) {
                    r += ' ' + attr + '="' + v.quote() + '"';
                } else {
                    yr.log({
                        id: 'NO_QUOTE',
                        message: "Attr doesn't have quote() method",
                        data: {
                            key: attr,
                            value: v
                        }
                    });
                }
            } else {
                yr.log({
                    id: 'BAD_PROTOTYPE',
                    message: 'Object prototype is corrupted',
                    data: {
                        key: attr,
                        value: v
                    }
                });
            }
        }
        */
        r += (yr.shortTags[name]) ? '/>' : '>';
        a.s = null;

        return r;
    }

    return '';
};

yr.copyAttrs = function copyAttrs(to, from) {
    for (var key in from) {
        to[key] = from[key];
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.scalarAttr = function(s) {
    //  NOTE: См. коммент про Safari выше.

    this.s = (s == null) ? '' : ('' + s);
};

yr.scalarAttr.prototype.quote = function() {
    return yr.text2attr(this.s);
};

function quoteAmp(s) {
    return s.replace(/&/g, '&amp;');
}

yr.scalarAttr.prototype.addxml = function(xml) {
    return new yr.xmlAttr( quoteAmp(this.s) + xml );
};

yr.scalarAttr.prototype.addscalar = function(xml) {
    return new yr.scalarAttr( this.s + xml );
};

yr.xmlAttr = function(s) {
    //  NOTE: См. коммент про Safari выше.

    this.s = (s == null) ? '' : ('' + s);
};

yr.xmlAttr.prototype.quote = function() {
    return yr.xml2attr(this.s);
};

yr.xmlAttr.prototype.addscalar = function(scalar) {
    return new yr.xmlAttr( this.s + quoteAmp(scalar) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.slice = function(s, from, to) {
    //  NOTE: См. коммент про Safari выше.

    s = '' + s;
    return (to) ? s.slice(from, to) : s.slice(from);
};

yr.exists = function(nodeset) {
    return nodeset.length > 0;
};

yr.grep = function(nodeset, predicate) {
    var r = [];
    for (var index = 0, count = nodeset.length; index < count; index++) {
        var node = nodeset[index];
        if (predicate(node, index, count)) {
            r.push(node);
        }
    }
    return r;
};

yr.byIndex = function(nodeset, i) {
    return nodeset.slice(i, i + 1);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.sort = function(nodes, by, desc) {
    var values = [];
    for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i];
        var value = by(node, i, l);
        values.push({
            node: node,
            value: value
        });
    }

    var greater = (desc) ? -1 : +1;
    var less = (desc) ? +1 : -1;

    var sorted = values.sort(function(a, b) {
        var va = a.value;
        var vb = b.value;
        if (va < vb) { return less; }
        if (va > vb) { return greater; }
        return 0;
    });

    var r = [];
    for (var i = 0, l = sorted.length; i < l; i++) {
        r.push( sorted[i].node );
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.nodeset2data = function(nodes) {
    var l = nodes.length;
    if (l === 0) {
        return '';
    }

    if (l === 1) {
        return nodes[0].data;
    }

    var data = [];
    for (var i = 0; i < l; i++) {
        data.push( nodes[i].data );
    }

    return data;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.externals = {};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Module
//  ---------------------------------------------------------------------------------------------------------------  //


var Module = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  NOTE: ex applyValue.
Module.prototype.a = function applyValue(M, nodeset, mode, a0) {
    var r = '';

    //  Достаем аргументы, переданные в apply, если они там есть.
    var args;
    if (arguments.length > 4) {
        args = Array.prototype.slice.call(arguments, 4);
    }

    var imports = M.imports;

    //  Идем по нодесету.
    for (var i0 = 0, l0 = nodeset.length; i0 < l0; i0++) {
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
        var template;
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
                        template = module[tid];

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
            if (args) {
                //  Шаблон позвали с параметрами, приходится изгаляться.
                r += template.apply( M, [M, c0, i0, l0, a0].concat(args) );
            } else {
                r += template(M, c0, i0, l0, a0);
            }
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.matched = function matched(jpath, abs, c0, i0, l0) {
    if (jpath === 1) {
        //  Это jpath '/'
        return !c0.parent;
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

//  NOTE: ex selectN.
Module.prototype.s = function selectN(jpath, node) {
    return this.n( jpath, [ node ] );
};

//  NOTE: ex selectNs.
Module.prototype.n = function selectNs(jpath, nodeset) {

    var current = nodeset;
    var m = current.length;

    var result;
    for (var i = 0, n = jpath.length; i < n; i += 2) {
        result = [];

        var type = jpath[i];
        var step = jpath[i + 1];

        switch (type) {

            case 0: // Это nametest (.foo или .*), в step 'foo' или '*'.
                for (var j = 0; j < m; j++) {
                    yr.selectNametest(step, current[j], result);
                }
                break;

            case 1: // Это dots (., .., ...), в step количество шагов минус один ( . -- 0, .. -- 1, ... -- 2 и т.д. ).
                for (var j = 0; j < m; j++) {
                    var k = 0;
                    var node = current[j];
                    while (k < step && node) {
                        node = node.parent;
                        k++;
                    }
                    if (node) {
                        result.push(node);
                    }
                }
                break;

            case 2: // Это filter, в step предикат.
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    if (step(this, node, j, m)) { // Предикат принимает четыре параметра: module, node, index и count.
                        result.push(node);
                    }
                }
                break;

            case 3: // Это index, в step индекс нужного элемента.
                var node = current[ step ];
                result = (node) ? [ node ] : [];
                break;

            case 4:
                //  Это глобальный гвард.
                if (m > 0) {
                    var node = current[0];
                    if ( step(this, node.doc.root, 0, 1) ) {
                        result = result.concat(current);
                    }
                }

        }

        current = result;
        m = current.length;

        if (!m) { return []; }
    }

    return result;
};

yr.selectNametest = function selectNametest(step, context, result) {

    var data = context.data;

    if (!data || typeof data !== 'object') { return result; }

    if (step === '*') {
        if (data instanceof Array) {
            for (var i = 0, l = data.length; i < l; i++) {
                yr.selectNametest(i, context, result);
            }
        } else {
            for (step in data) {
                yr.selectNametest(step, context, result);
            }
        }
        return result;
    }

    data = data[step];
    if (data === undefined) { return result; }

    var doc = context.doc;
    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            result.push({
                data: data[i],
                parent: context,
                name: step,
                //  FIXME: Не нравится мне этот doc.
                doc: doc
            });
        }
    } else {
        result.push({
            data: data,
            parent: context,
            name: step,
            //  FIXME: Не нравится мне этот doc.
            doc: doc
        });
    }

    return result;
};

yr.document = function(nodeset) {
    var doc;
    if (!nodeset.length) {
        doc = new Doc( {} );
    } else {
        doc = new Doc( nodeset[0].data );
    }
    return [ doc.root ];
};

yr.subnode = function(name, data, context) {
    var doc = context.doc;

    if (data instanceof Array) {
        var nodeset = [];
        for (var i = 0, l = data.length; i < l; i++) {
            nodeset.push({
                data: data[i],
                name: name,
                parent: context,
                doc: doc
            });
        }
        return nodeset;
    }

    return [
        {
            data: data,
            name: name,
            parent: context,
            doc: doc
        }
    ];
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Глобальные переменные у нас "ленивые" с кэшированием.
//  В this[name] находится только лишь функция,
//  вычисляющая нужное значение.
//
//  NOTE: ex vars
Module.prototype.v = function vars(id, c0) {
    var vars = c0.doc._vars;
    var value = vars[id];
    if (value === undefined) {
        var var_ = this.findSymbol(id);
        value = (typeof var_ === 'function') ? var_(this, c0, 0, 1) : var_;
        vars[id] = value;
    }
    return value;
};

//  FIXME: Тут еще бывает a0, а иногда не бывает.
//
//  NOTE: ex funcs
Module.prototype.f = function funcs(id, c0, i0, l0, v0) {
    var func = this.findSymbol(id);

    if (arguments.length > 5) {
        //  Два и более аргументов.
        var args = Array.prototype.slice.call(arguments);
        args[0] = this;
        return func.apply(this, args);
    }

    if (v0 !== undefined) {
        //  Один аргумент.
        return func(this, c0, i0, l0, v0);
    }

    //  Без аргументов.
    return func(this, c0, i0, l0);
};

//  NOTE: ex keys.
Module.prototype.k = function keys(id, use, c0, multiple) {
    var keys = c0.doc._keys;

    var key = this.findSymbol(id);

    var cache = keys[id];
    if (!cache) {
        cache = this._initKey(key, id, use, c0);
    }

    var values = cache.values;
    var nodes = cache.nodes;

    var that = this;

    if (multiple) {
        //  В use -- нодесет.
        var r;

        if (cache.xml) {
            r = '';
            for (var i = 0, l = use.length; i < l; i++) {
                var c0 = use[i];
                r += getValue( yr.nodeValue(c0) );
            }
        } else {
            r = [];
            for (var i = 0, l = use.length; i < l; i++) {
                var c0 = use[i];
                r = r.concat( getValue( yr.nodeValue(c0) ) );
            }
        }

        return r;

    } else {
        //  В use -- скаляр.
        var value = values[use];
        if (value === undefined) {
            value = getValue(use);
        }

        return value;

    }

    function getValue(use) {
        var nodes_ = nodes[use];

        var r;
        if (cache.xml) {
            r = '';
            if (nodes_) {
                for (var i = 0, l = nodes_.length; i < l; i++) {
                    var node = nodes_[i];
                    //  FIXME: Нельзя ли тут последний параметр сделать общим,
                    //  а не создавать его для каждого элемента цикла?
                    r += key.b( that, node.c, node.i, node.l, {} );
                }
            }
        } else {
            r = [];
            if (nodes_) {
                for (var i = 0, l = nodes_.length; i < l; i++) {
                    var node = nodes_[i];
                    r = r.concat( key.b(that, node.c, node.i, node.l) );
                }
            }
        }

        values[use] = r;

        return r;
    }

};

Module.prototype._initKey = function(key, id, use, c0) {
    var keys = c0.doc._keys;
    var cache = keys[id] = {};

    //  Тело ключ имеет тип xml.
    cache.xml = (key.bt === 'xml');

    //  Вычисляем нодесет с нодами, которые матчатся ключом.
    var matched = key.n(this, c0);
    //  Хранилище для этих нод.
    var nodes = cache.nodes = {};

    //  Значение use ключа может возвращать нодесет или скаляр.
    if (key.ut === 'nodeset') {
        for (var i0 = 0, l0 = matched.length; i0 < l0; i0++) {
            var c1 = matched[i0];
            //  Тип use_ -- nodeset.
            var use_ = key.u(this, c1, i0, l0);

            for (var j = 0, m = use_.length; j < m; j++) {
                store( yr.nodeValue( use_[j] ), { c: c1, i: i0, l: l0 } );
            }
        }

    } else {
        for (var i0 = 0, l0 = matched.length; i0 < l0; i0++) {
            var c1 = matched[i0];
            //  Тип use_ -- nodeset.
            var use_ = key.u(this, c1, i0, l0);

            store( use_, { c: c1, i: i0, l: l0 } );
        }

    }

    //  Хранилище для уже вычисленных значений ключа.
    cache.values = {};

    return cache;

    //  Сохраняем ноду по соответствующему ключу.
    //  Одному ключу может соответствовать несколько нод.
    function store(key, info) {
        var items = nodes[key];
        if (!items) {
            items = nodes[key] = [];
        }
        items.push(info);
    }


};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.findSymbol = function(id) {
    var imports = this.imports;
    for (var i = 0, l = imports.length; i < l; i++) {
        var module = imports[i];
        var symbol = module[id];
        if (symbol !== undefined) { return symbol; }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

function Doc(data) {
    //  FIXME: Что тут использовать? Array.isArray?
    if (data instanceof Array) {
        data = {
            //  FIXME: Сделать название поля ('item') настраеваемым.
            'item': data
        };
    }

    this.root = {
        data: data,
        parent: null,
        name: '',
        doc: this
    };

    this._vars = {};
    this._keys = {};
}

//  ---------------------------------------------------------------------------------------------------------------  //



yr.Module = Module;

//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

//  NOTE: Для использования из node.js.
//  При этом недостаточно просто проверить window/document.
//  Потому что в тестах runtime грузится не как модуль (пока что, надеюсь),
//  но просто эвалится, поэтому в нем module не определен.
//
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    module.exports = yr;
}

