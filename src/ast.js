
// Base AST class.

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST = function() {};

Yate.AST._asts = {};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.options = {};

Yate.AST.prototype.Rid = 0;
Yate.AST.prototype.Cid = 0;

Yate.AST.prototype._init = function() {};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.error = function(s) {
    require('util').puts(new Error().stack);
    throw 'ERROR: ' + s + '\n' + Yate.Parser._where(this.where);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.make = function(id) {
    var ast = new (Yate.AST.$(id))();
    ast.id = id; // Если делать это в прототипе, то не видно в console.log.
    ast._init.apply(ast, Array.prototype.slice.call(arguments, 1));
    return ast;
};

Yate.AST.prototype.make = function() {
    var ast = Yate.AST.make.apply(null, arguments);
    ast.parent = this;
    ast.setLocals();
    return ast;
};


Yate.AST.$ = function(id) {
    var ast = this._asts[id];

    if (!ast) {

        ast = function() {};

        var info = Yate.AST[id] || {};
        var options = info.options = info.options || {};

        var base = (options.base) ? this.$(options.base) : Yate.AST;
        var mixin = [];
        if (options.mixin) {
            options.mixin = Yate.Common.makeArray(options.mixin);
            mixin = mixin.concat(Yate.Common.map(options.mixin, function(id) { return Yate.AST[id] || {}; }));
        }
        mixin.push(info);
        Yate.Common.inherits(ast, base, mixin);

        this._asts[id] = ast;
    }

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.yate = function(id, data, mode) {
    return this._yate(id, data, mode);
};

Yate.AST.prototype._yate = function(id, data, mode) {
    return this._fill('yate', id, data, mode);
};

Yate.AST.prototype.js = function(id, data, mode) {
    return this._js(id, data, mode);
};

Yate.AST.prototype._js = function(id, data, mode) {
    return this._fill('js', id, data, mode);
};

Yate.AST.prototype._fill = function(type, id, data, mode) {
    if (typeof id == 'object') {
        data = id.data;
        mode = id.mode;
        id = id.id;
    }

    id = id || this.id;
    data = data || this;
    mode = mode || '';

    return CodeTemplates.fill(type, id, mode, data, type);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.childrenKeys = function() {
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

Yate.AST.prototype.children = function() {
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
    /*
    var order = this.options.order;
    if (order) {
        for (var i = 0, l = order.length; i < l; i++) {
            children.push(this[order[i]]);
        }
    } else {
        for (var key in this) {
            if (this.hasOwnProperty(key) && /^[A-Z]/.test(key)) {
                children.push(this[key]);
            }
        }
    }
    return children;
    */
};

Yate.AST.prototype._apply = function(callback) {
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
        } else if (child instanceof Yate.AST) {
            callback.apply(child, args);
        }
    }
};

Yate.AST.prototype.trigger = function(method) {
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

Yate.AST.prototype.setParents = function() {
    function set(parent) {
        this.parent = parent;
        this._apply(set, this);
    }

    set.call(this, null);
};

// ----------------------------------------------------------------------------------------------------------------- //
// Type methods
// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.type = function(to) {
    var type = this._type;
    if (type === undefined) {
        type = this._type = this._getType();
    }

    return (to) ? Yate.Types.convertable(type, to) : type;
};

Yate.AST.prototype._getType = function() {
    return Yate.Types.NONE;
};

Yate.AST.prototype.cast = function(to) {
    var from = this.type();
    to = to || from;

    if (from != to) {
        this.AsType = to;

        if (!Yate.Types.convertable(from, to)) {
            this.error('Cannot convert type from ' + from + ' to ' + to + ' ' + this.id);
        }
    }

    this.oncast(to);
};

Yate.AST.prototype.oncast = function(to) {
    // Do nothing.
};

Yate.AST.prototype.toValue = function() {
    var type = this.type();

    if (type == Yate.Types.ARRAY || type == Yate.Types.OBJECT) {
        this.cast(type);
    } else {
        this.cast(Yate.Types.XML);
    }
};

Yate.AST.prototype.is = function(type) {
    if (type instanceof Array) {
        for (var i = 0, l = type.length; i < l; i++) {
            if (this instanceof Yate.AST.$(type[i])) {
                return true;
            }
        }
    } else {
        return this instanceof Yate.AST.$(type);
    }
};

Yate.AST.prototype.inline = function() {
    return false;
};

// ----------------------------------------------------------------------------------------------------------------- //
// Walk methods
// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.setLocals = function() {
    var options = this.options.locals || {};
    var locals = Yate.AST.locals;
    var parent = this.parent;

    for (var local in locals) {
        var parentLocal = (parent) ? parent[local] : null;
        if (options[local]) {
            this[local] = (parentLocal) ? parentLocal.child() : new locals[local]();
        } else {
            this[local] = parentLocal;
        }
    }

    this.Sid = this.scope.id;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.log = function() {
    // console.log(this.id);
    return require('util').inspect(this, true, null);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.set = function(key, value) {
    this.trigger(function() {
        this[key] = value;
    });
};

Yate.AST.prototype.rid = function() {
    this.set('Rid', this.Rid + 1);
};

Yate.AST.prototype.cid = function() {
    this.set('Cid', this.Cid + 1);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.isOpen = function() {
    if (this.type() == Yate.Types.ATTR || this.type() == Yate.Types.XML) {
        return undefined;
    }
    return false;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.prototype.toString = function() {
    var r = [];
    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child !== undefined) {
            if (child instanceof Yate.AST) {
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

Yate.AST.var_type = {
    USER: 'user',
    ARGUMENT: 'argument'
};

Yate.AST.function_type = {
    USER: 'user',
    INTERNAL: 'internal',
    EXTERNAL: 'external',
    KEY: 'key'
};

