
//  ---------------------------------------------------------------------------------------------------------------  //
//  yate runtime
//  ---------------------------------------------------------------------------------------------------------------  //

var yr = {};

(function() {

//  TODO:
//  Пустой массив. Можно использовать везде, где предполается,
//  что он read-only. Например, когда из select() возвращается пустой нодесет и т.д.
//  var emptyA = [];

var modules = {};

yr.register = function(id, module) {
    if ( modules[id] ) {
        throw Error('Module "' + id + '" already exists');
    }

    //  Резолвим ссылки на импортируемые модули.

    var ids = module.imports || [];
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

yr.run = function(id, data, mode) {
    mode = mode || '';

    var module = modules[id];

    var root = module.makeRoot(data);

    return module.applyValue( [ root ], mode, { attrs: {} } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.externals = {};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Module
//  ---------------------------------------------------------------------------------------------------------------  //


var Module = function() {
    this._vars = {};
    this._keys = {};
};

//  Создаем из js-объекта корневую ноду.
Module.prototype.makeRoot = function makeRoot(data) {
    var root = {
        data: data,
        parent: null,
        name: '',
        root: null
    };
    //  FIXME: Очень мне не нравится эта идея.
    //  Может таки таскать везде root явно?
    root.root = root;

    return root;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.applyValue = function applyValue(nodeset, mode, a0, _) {
    var r = '';

    //  Достаем аргументы, переданные в apply, если они там есть.
    var args;
    if (_ !== undefined) {
        args = Array.prototype.slice.call(arguments, 3);
    }

    var imports = this.imports;

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

            //  NOTE: Мы не можем тут воспользоваться переменной template,
            //  хотя в ней уже лежит значение module[found].
            //  Если мы напишем просто template(...), то потеряем нужный this.
            if (args) {
                //  Шаблон позвали с параметрами, приходится изгаляться.
                r += template.apply( module, [module, c0, i0, l0, a0].concat(args) );
            } else {
                r += template(module, c0, i0, l0, a0);
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
        if (step === 0) {
            //  Nametest.
            var name = jpath[i + 1];
            if (name !== '*' && name !== c0.name) { return false; }
            c0 = c0.parent;

        } else {
            //  Predicate (step === 2 должен быть).
            var predicate = jpath[i + 1];
            if ( !predicate(this, c0, i0, l0) ) { return false; }

        }

        i -= 2;
    }

    if (abs && c0.parent) {
        return false;
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.selectN = function selectN(jpath, node) {
    return this.selectNs( jpath, [ node ] );
};

Module.prototype.selectNs = function selectNs(jpath, nodeset) {

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
                    this.selectNametest(step, current[j], result);
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

        }

        current = result;
        m = current.length;

        if (!m) { return []; }
    }

    return result;
};

Module.prototype.selectNametest = function selectNametest(step, context, result) {

    var data = context.data;

    if (typeof data !== 'object') { return; }

    if (step === '*') {
        for (step in data) {
            this.selectNametest(step, context, result);
        }
        return;
    }

    data = data[step];
    if (data === undefined) { return; }

    var root = context.root;
    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            result.push({
                data: data[i],
                parent: context,
                name: step,
                //  FIXME: Не нравится мне этот root.
                root: root
            });
        }
    } else {
        result.push({
            data: data,
            parent: context,
            name: step,
            //  FIXME: Не нравится мне этот root.
            root: root
        });
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.join = function(left, right) {
    return left.concat(right);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.nodeValue = function nodeValue(node) {
    var data = node.data;
    return (typeof data == 'object') ? '': data;
};

Module.prototype.nodeName = function nodeName(nodeset) {
    var node = nodeset[0];

    return (node) ? node.name : '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.simpleJPath = function(name, context) {
    var r = context.data[name];

    return (typeof r !== 'object') && r || '';
};

Module.prototype.nodeset2scalar = function nodeset2scalar(nodeset) {
    if (!nodeset.length) { return ''; }

    var data = nodeset[0].data;
    return (typeof data == 'object') ? '': data;
};

Module.prototype.nodeset2boolean = function nodeset2boolean(nodeset) {
    if (! (nodeset && nodeset.length > 0) ) {
        return false;
    }

    return !!nodeset[0].data;
};

Module.prototype.nodeset2xml = function nodeset2xml(nodeset) {
    return this.scalar2xml( this.nodeset2scalar(nodeset) );
};

Module.prototype.nodeset2attrvalue = function nodeset2attrvalue(nodeset) {
    return this.scalar2attrvalue( this.nodeset2scalar(nodeset) );
};

Module.prototype.scalar2xml = function scalar2xml(scalar) {
    return scalar
        .toString()
        .replace(/&(?![A-Za-z#]\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

Module.prototype.scalar2attrvalue = function scalar2attrvalue(scalar) {
    return scalar
        .toString()
        .replace(/&(?![A-Za-z#]\w+;)/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/*
FIXME: Откуда вообще взялась идея, что xml в атрибуты нужно кастить не так, как скаляры?!

Module.prototype.xml2attrvalue = function(xml) {
    return xml
        .toString()
        .replace(/"/g, '&quot;');
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.shortTags = {
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

Module.prototype.closeAttrs = function closeAttrs(a) {
    var name = a.start;

    if (name) {
        var r = '';
        var attrs = a.attrs;

        for (var attr in attrs) {
            r += ' ' + attr + '="' + this.attrQuote(attrs[attr]) + '"';
        }
        r += (this.shortTags[name]) ? '/>' : '>';
        a.start = null;

        return r;
    }

    return '';
};

Module.prototype.copyAttrs = function copyAttrs(to, from) {
    for (var key in from) {
        to[key] = from[key];
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Module.prototype.attrQuote = function attrQuote(s) {
    if (s == null) { return ''; }
    s = s.toString();
    s = s.replace(/&(?![A-Za-z#]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
};

Module.prototype.textQuote = function textQuote(s) {
    if (s == null) { return ''; }
    s = s.toString();
    s = s.replace(/&(?![A-Za-z#]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
};

Module.prototype.slice = function(s, from, to) {
    s = s.toString();
    return (to) ? s.slice(from, to) : s.slice(from);
};

Module.prototype.exists = function(nodeset) {
    return nodeset.length > 0;
};

Module.prototype.grep = function(nodeset, predicate) {
    var r = [];
    for (var index = 0, count = nodeset.length; index < count; index++) {
        var node = nodeset[index];
        if (predicate(node, index, count)) {
            r.push(node);
        }
    }
    return r;
};

Module.prototype.byIndex = function(nodeset, i) {
    return nodeset.slice(i, i + 1);
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Глобальные переменные у нас "ленивые" с кэшированием.
//  В this[name] находится только лишь функция,
//  вычисляющая нужное значение.
Module.prototype.vars = function vars(id, c0) {
    var value = this._vars[id];
    if (value === undefined) {
        var var_ = this.findSymbol(id);
        value = this._vars[id] = var_(this, c0, 0, 1);
    }
    return value;
};

//  FIXME: Тут еще бывает a0, а иногда не бывает.
Module.prototype.funcs = function funcs(id, c0, i0, l0, v0, _) {
    var func = this.findSymbol(id);

    if (_ !== undefined) {
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

Module.prototype.keys = function(id, use, c0, multiple) {
    var key = this.findSymbol(id);

    var cache = this._keys[id];
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
                r += getValue( this.nodeValue(c0) );
            }
        } else {
            r = [];
            for (var i = 0, l = use.length; i < l; i++) {
                var c0 = use[i];
                r = r.concat( getValue( this.nodeValue(c0) ) );
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
        nodes_ = nodes[use];

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
    var cache = this._keys[id] = {};

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
                store( this.nodeValue( use_[j] ), { c: c1, i: i0, l: l0 } );
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
        if (symbol) { return symbol; }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yr.Module = Module;

//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

