
// Base AST class.

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST = function() {};

yate.AST._asts = {};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.options = {};

yate.AST.prototype.Rid = 0;
yate.AST.prototype.Cid = 0;

yate.AST.prototype._init = function() {};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.error = function(s) {
    require('util').puts(new Error().stack);
    throw 'ERROR: ' + s + '\n' + yate.Parser._where(this.where);
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
    ast.setLocals();
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

yate.AST.prototype.yate = function(id, data, mode) {
    return this._yate(id, data, mode);
};

yate.AST.prototype._yate = function(id, data, mode) {
    return this._fill('yate', id, data, mode);
};

yate.AST.prototype.js = function(id, data, mode) {
    return this._js(id, data, mode);
};

yate.AST.prototype._js = function(id, data, mode) {
    return this._fill('js', id, data, mode);
};

yate.AST.prototype._fill = function(type, id, data, mode) {
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

yate.AST.prototype.oncast = function(to) {
    // Do nothing.
};

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

yate.AST.prototype.inline = function() {
    return false;
};

// ----------------------------------------------------------------------------------------------------------------- //
// Walk methods
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.prototype.setLocals = function() {
    var options = this.options.locals || {};
    var locals = yate.AST.locals;
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

yate.AST.prototype.isOpen = function() {
    if (this.type() == yate.types.ATTR || this.type() == yate.types.XML) {
        return undefined;
    }
    return false;
};

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

