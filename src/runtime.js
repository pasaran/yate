// Yate Runtime.

var Yater = function() {};

Yater.prototype.init = function(matcher) {
    this.matcher = matcher;
};

Yater.run = function(data, name, mode) {
    name = name || 'default';
    mode = mode || '';

    var yater = new Yater();
    var module = Yater.modules[name];

    var root = Yater.makeRoot(data);
    var matcher = module(yater, root);
    yater.init(matcher);

    return yater.applyValue( root, mode, { attrs: {} } );
};

// ----------------------------------------------------------------------------------------------------------------- //

// Создаем из js-объекта корневую ноду.

Yater.makeRoot = function(data) {
    return [
        {
            data: data,
            parent: null,
            name: ''
        }
    ];
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.applyValue = function(nodeset, mode, attrs, _) {

    var modeMatcher = this.matcher[mode];
    if (!modeMatcher) { return ''; }

    var args;
    var r = '';

    for (var index = 0, count = nodeset.length; index < count; index++) {
        var context = nodeset[index];
        var name = context.name || '';
        var templatesList = modeMatcher[name] || modeMatcher['*'] || [];

        for (var i = 0, l = templatesList.length; i < l; i++) {
            var template = templatesList[i];
            if (this.matched(template.jpath, context, index, count)) {
                if (_ !== undefined) {
                    if (!args) {
                        args = Array.prototype.slice.call(arguments, 3);
                    }
                    r += template.body.apply(null, [ context, attrs, index, count ].concat(args));
                } else {
                    r += template.body(context, attrs, index, count);
                }
                break;
            }
        }
        // FIXME: console.log('DEFAULT TEMPLATE');
    }

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.select = function(jpath, context) {

    var current, m;
    if (context instanceof Array) {
        current = context;
        m = current.length;
    } else {
        current = [ context ];
        m = 1;
    }

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
                    var node = context;
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
                    if (step(node, j, m)) { // Предикат принимает три параметра: node, index и count.
                        result.push(node);
                    }
                }
                break;

            case 3: // Это index, в step индекс нужного элемента.
                var node = current[step];
                result = (node) ? [node] : [];
                break;

        }

        current = result;
        m = current.length;

        if (!m) { return []; }
    }

    return result;
};

Yater.prototype.selectNametest = function(step, context, result) {

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

    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            result.push({
                data: data[i],
                parent: context,
                name: step
            });
        }
    } else {
        result.push({
            data: data,
            parent: context,
            name: step
        });
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.join = function(left, right) {
    return left.concat(right);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.matched = function(jpath, context, index, count) {
    if (jpath === null) { // Это jpath /
        return !context.parent;
    }

    var l = jpath.length;
    var i = l - 2; // i всегда будет четное.
    while (i >= 0) {
        if (!context) { return false; }

        var step = jpath[i]; // Тут step может быть либо 0 (nametest), либо 2 (predicate).
                             // Варианты 1 (dots) и 3 (index) в jpath'ах в селекторах запрещены.
        if (step === 0) { // Nametest.
            var name = jpath[i + 1];
            if ( name !== '*' && name !== context.name ) { return false; }
            context = context.parent;
        } else { // step === 2 должен быть.
            var predicate = jpath[i + 1];
            if (!predicate(context, index, count)) { return false; }
        }

        i -= 2;
    }

    return true;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.nodeValue = function(node) {
    var data = node.data;
    return (typeof data == 'object') ? '': data;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.nodeset2scalar = function(nodeset) {
    if (!nodeset.length) { return ''; }

    var data = nodeset[0].data;
    return (typeof data == 'object') ? '': data;
};

Yater.prototype.nodeset2boolean = function(nodeset) {
    return (nodeset.length > 0);
};

Yater.prototype.nodeset2xml = function(nodeset) {
    return this.scalar2xml( this.nodeset2scalar(nodeset) );
};

Yater.prototype.nodeset2attrvalue = function(nodeset) {
    return this.scalar2attrvalue( this.nodeset2scalar(nodeset) );
};

Yater.prototype.scalar2xml = function(scalar) {
    return scalar
        .toString()
        .replace(/&(?![A-Za-z]\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

Yater.prototype.scalar2attrvalue = function(scalar) {
    return scalar
        .toString()
        .replace(/&(?![A-Za-z]\w+;)/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.shortTags = {
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

Yater.prototype.closeAttrs = function(a) {
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

Yater.prototype.copyAttrs = function(to, from) {
    for (var key in from) {
        to[key] = from[key];
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.prototype.attrQuote = function(s) {
    if (!s) { return ''; }
    s = s.toString();
    s = s.replace(/&(?![A-Za-z]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
};

Yater.prototype.textQuote = function(s) {
    if (!s) { return ''; }
    s = s.toString();
    s = s.replace(/&(?![A-Za-z]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
};

Yater.prototype.slice = function(s, from, to) {
    s = s.toString();
    return (to) ? s.slice(from, to) : s.slice(from);
};

Yater.prototype.grep = function(nodeset, predicate) {
    var r = [];
    for (var index = 0, count = nodeset.length; index < count; index++) {
        var node = nodeset[index];
        if (predicate(node, index, count)) {
            r.push(node);
        }
    }
    return r;
};

Yater.prototype.byIndex = function(nodeset, i) {
    return nodeset.slice(i, i + 1);
};

// ----------------------------------------------------------------------------------------------------------------- //
// Yater.Vars -- хранилище глобальных (ленивых) переменных.
// ----------------------------------------------------------------------------------------------------------------- //

Yater.Vars = function() {
    this.vars = {};
    this.values = {};
};

Yater.Vars.prototype.add = function(name, value) {
    this.vars[name] = value;
};

Yater.Vars.prototype.get = function(name, root) {
    var value = this.values[name];
    if (value === undefined) {
        value = this.values[name] = this.vars[name](root);
    }
    return value;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yater.modules = {};

