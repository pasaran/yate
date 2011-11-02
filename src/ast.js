
// Base AST class.

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST = function() {};

yate.AST.prototype._init = function() {};

yate.AST._asts = {};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.options = {};

yate.AST.prototype.Rid = 0;
yate.AST.prototype.Cid = 0;

yate.AST.prototype.state = {
    // Глобальные id-шники:
    jid: 0, // jpath'ы.
    pid: 0, // Предикаты.
    tid: 0, // Шаблоны.
    vid: 0, // Переменные.
    fid: 0, // Функции.
    kid: 0  // Ключи.
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.error = function(s) {
    require('util').puts(new Error().stack);
    throw 'ERROR: ' + s + '\n' + yate.parser._where(this.where);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.make = function(id) {
    var ast = new (yate.AST.$(id))();
    ast.id = id; // Если делать это в прототипе, то не видно в console.log.
    ast._init.apply(ast, Array.prototype.slice.call(arguments, 1));
    return ast;
};

yate.AST.prototype.make = function() {
    var ast = yate.AST.make.apply(null, arguments);
    ast.parent = this;
    ast.setScope();
    return ast;
};


yate.AST.$ = function(id) {
    var ast = this._asts[id];

    if (!ast) {

        ast = function() {};

        var info = yate.AST[id] || {};
        var options = info.options = info.options || {};

        var base = (options.base) ? this.$(options.base) : yate.AST;
        var mixin = [];
        if (options.mixin) {
            options.mixin = yate.makeArray(options.mixin);
            mixin = mixin.concat(yate.map(options.mixin, function(id) { return yate.AST[id] || {}; }));
        }
        mixin.push(info);
        yate.inherits(ast, base, mixin);

        this._asts[id] = ast;
    }

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.childrenKeys = function() {
    var keys = [];
    var order = this.options.order;
    if (order) {
        for (var i = 0, l = order.length; i < l; i++) {
            keys.push(order[i]);
        }
    } else {
        for (var key in this) {
            if (this.hasOwnProperty(key) && /^[A-Z]/.test(key)) {
                keys.push(key);
            }
        }
    }
    return keys;
};

yate.AST.prototype.children = function() {
    var children = [];

    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child !== undefined) {
            children.push( this[key] );
        }
    }

    return children;
};

yate.AST.prototype._apply = function(callback) {
    var args = Array.prototype.slice.call(arguments, 1);

    var children = this.children();
    for (var i = 0, l = children.length; i < l; i++) {
        step(children[i]);
    }

    function step(child) {
        if (child instanceof Array) {
            for (var j = 0, m = child.length; j < m; j++) {
                step(child[j]);
            }
        } else if (child instanceof yate.AST) {
            callback.apply(child, args);
        }
    }
};

yate.AST.prototype.trigger = function(method) {
    var args = Array.prototype.slice.call(arguments, 1);

    run.apply(this, args);

    function run() {
        var callback;
        if ((typeof method == 'function')) {
            callback = method;
        } else if (typeof method == 'string' && typeof this[method] == 'function') {
            callback = this[method];
        }
        var args = Array.prototype.slice.call(arguments);
        if (callback) {
            callback.apply(this, args);
        }
        this._apply.apply(this, [ run ].concat(args));
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.setParents = function() {
    function set(parent) {
        this.parent = parent;
        this._apply(set, this);
    }

    set.call(this, null);
};

// ----------------------------------------------------------------------------------------------------------------- //
// Type methods
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.type = function(to) {
    var type = this._type;
    if (type === undefined) {
        type = this._type = this._getType();
    }

    return (to) ? yate.types.convertable(type, to) : type;
};

yate.AST.prototype._getType = function() {
    return yate.types.NONE;
};

yate.AST.prototype.cast = function(to) {
    var from = this.type();
    to = to || from;

    if (from != to) {
        this.AsType = to;

        if (!yate.types.convertable(from, to)) {
            this.error('Cannot convert type from ' + from + ' to ' + to + ' ' + this.id);
        }
    }

    this.oncast(to);
};

yate.AST.prototype.oncast = yate.nop;

yate.AST.prototype.toValue = function() {
    var type = this.type();

    if (type == yate.types.ARRAY || type == yate.types.OBJECT) {
        this.cast(type);
    } else {
        this.cast(yate.types.XML);
    }
};

yate.AST.prototype.is = function(type) {
    if (type instanceof Array) {
        for (var i = 0, l = type.length; i < l; i++) {
            if (this instanceof yate.AST.$(type[i])) {
                return true;
            }
        }
    } else {
        return this instanceof yate.AST.$(type);
    }
};

yate.AST.prototype.inline = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //
// Walk methods
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.setScope = function() {
    var parent = this.parent;

    var scope = (parent) ? parent.scope : null;
    if (this.options.scope) {
        scope = (scope) ? scope.child() : new yate.Scope();
    }

    if (scope) {
        this.scope = scope;
        this.Sid = scope.id;
    }
};

yate.AST.prototype.getScope = function() {
    return this.scope.top();
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.log = function() {
    // console.log(this.id);
    return require('util').inspect(this, true, null);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.set = function(key, value) {
    this.trigger(function() {
        this[key] = value;
    });
};

yate.AST.prototype.rid = function() {
    this.set('Rid', this.Rid + 1);
};

yate.AST.prototype.cid = function() {
    this.set('Cid', this.Cid + 1);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.opens = yate.false;

yate.AST.prototype.closes = yate.true;

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.toString = function() {
    var r = [];
    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child !== undefined) {
            if (child instanceof yate.AST) {
                var s = child.toString();
                if (s) {
                    r.push( key.blue.bold + ': ' + s);
                }
            } else {
                r.push( key.blue.bold + ': ' + JSON.stringify(child) );
            }
        }
    }
    if (r.length) {
        var s = this.id.bold + '( ' + this.type().lime;
        if (this.AsType) {
            s += ' -> '.lime + this.AsType.lime;
        }
        s += ' )\n' + r.join('\n').replace(/^/gm, '    ');
        return s;
    }
    return '';
};

// ----------------------------------------------------------------------------------------------------------------- //

// FIXME: Унести в ast/var_.js и ast/function_.js соответственно.

yate.AST.var_type = {
    USER: 'user',
    ARGUMENT: 'argument'
};

yate.AST.function_type = {
    USER: 'user',
    INTERNAL: 'internal',
    EXTERNAL: 'external',
    KEY: 'key'
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype._code = function(lang, mode) {

    // FIXME: Истребить в пользу AST.transform.
    var data = this;
    if (this[lang + 'data$' + mode]) {
        data = this[lang + 'data$' + mode]();
    } else if (this['codedata$' + mode]) {
        data = this['codedata$' + mode](lang);
    }

    var result = yate.codetemplates.fill(lang, data.id, mode, data);
    if (result !== undefined) {
        return result;
    }

    // Скажем, lang == 'js', а mode == 'foo'

    // Пробуем this.js$foo()
    if (data[lang + '$' + mode]) {
        return data[lang + '$' + mode]();
    }

    // Пробуем this.js$('foo')
    if (data[lang + '$']) {
        return data[lang + '$'](mode);
    }

    // Пробуем this.code$foo('js')
    if (data['code$' + mode]) {
        return data['code$' + mode](lang);
    }

    // Пробуем this.code$('js', 'foo')
    if (data['code$']) {
        return data['code$'](lang, mode);
    }

};

yate.AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};

yate.AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

yate.AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

