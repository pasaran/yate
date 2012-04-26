var common = require('./common.js');
var codegen = require('./codegen.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  Base AST class.
//  ---------------------------------------------------------------------------------------------------------------  //


function AST() {};

AST.prototype._init = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.options = {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.error = function(s) {
    var pos = this.where;
    throw new Error( 'ERROR: ' + s + '\n' + pos.input.where(pos) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.make = function(id) {
    var ast = new (AST.$(id))();
    //  Если делать это в прототипе, то не видно в console.log.
    ast.id = id;
    //  FIXME: Оставить только один аргумент и убрать apply/arguments.
    ast._init.apply(ast, Array.prototype.slice.call(arguments, 1));
    return ast;
};

AST.prototype.make = function() {
    var ast = AST.make.apply(null, arguments);
    ast.parent = this;
    /*
    ast.setScope();
    ast.Rid = this.Rid;
    ast.Cid = this.Cid;
    */
    return ast;
};


AST.$ = function(id) {
    var ast = this._asts[id];

    if (!ast) {

        ast = function() {};

        var info = AST[id] || {};
        var options = info.options = info.options || {};

        var base = (options.base) ? this.$(options.base) : AST;
        var mixin = [];
        if (options.mixin) {
            options.mixin = common.makeArray(options.mixin);
            mixin = mixin.concat( options.mixin.map( function(id) { return AST[id] || {}; } ) );
        }
        mixin.push(info);
        common.inherit(ast, base, mixin);

        this._asts[id] = ast;
    }

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.childrenKeys = function() {
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

AST.prototype.children = function() {
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

AST.prototype.applyChildren = function(callback, params) {
    var children = this.children();
    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i];
        if (child && typeof child === 'object') {
            callback(child, params);
        }
    }
};

AST.prototype.walkAfter = function(callback, params, pKey, pObject) {
    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child && typeof child === 'object') {
            child.walkAfter(callback, params, key, this);
        }
    }

    callback(this, params, pKey, pObject);
};

AST.prototype.walkBefore = function(callback, params, pKey, pObject) {
    callback(this, params, pKey, pObject);

    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child && typeof child === 'object') {
            child.walkBefore(callback, params, key, this);
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.setParents = function(parent) {
    this.parent = parent;
    var that = this;
    this.applyChildren(function(ast, parent) {
        ast.setParents(that);
    });
};

AST.prototype.is = function(type) {
    if (type instanceof Array) {
        for (var i = 0, l = type.length; i < l; i++) {
            if (this instanceof AST.$(type[i])) {
                return true;
            }
        }
    } else {
        return this instanceof AST.$(type);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.toString = function() {
    var r = [];
    var keys = this.childrenKeys();
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var child = this[key];
        if (child !== undefined) {
            if (child instanceof AST) {
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

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype._code = function(lang, mode) {

    // FIXME: Истребить в пользу AST.transform.
    var data = this;
    if (this[lang + 'data$' + mode]) {
        data = this[lang + 'data$' + mode]();
    } else if (this['codedata$' + mode]) {
        data = this['codedata$' + mode](lang);
    }

    var result = codegen.fill(lang, data.id, mode, data);
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

AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  asts.items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._init = function(items) {
    this.Items = common.makeArray(items || []);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.add = function(item) {
    this.Items.push(item);
};

asts.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

asts.items.empty = function() {
    return (this.Items.length == 0);
};

asts.items.iterate = function(callback) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], i);
    }
};

asts.items.grep = function(callback) {
    var items = this.Items;
    var r = [];
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (callback(item, i)) {
            r.push(item);
        }
    }
    return r;
};

asts.items.map = function(callback) {
    return this.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.code = function(lang, mode) {
    mode = mode || '';

    var result = this._code(lang, mode);
    if (result !== undefined) {
        return result;
    }

    var r = [];

    this.iterate(function(item) {
        r.push( item.code(lang, mode) );
    });

    // Пробуем this.jssep$mode(), затем this.codesep$mode().
    var suffix = 'sep$' + (mode || '');
    var sep = this[lang + suffix] || this['code' + suffix] || '';

    return r.join(sep);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
asts.items.someIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if (callback( items[i] )) { return true; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return true; }
        }
    }

    return false;
};

asts.items.allIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !items[i][callback]() ) { return false; }
        }
    }

    return true;
};

asts.items.noneIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return false; }
        }
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.applyChildren = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback( items[i], params );
    }
};

asts.items.walkAfter = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkAfter(callback, params, i, items);
    }

    callback(this, params);
};

asts.items.walkBefore = function(callback, params) {
    callback(this, params);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkBefore(callback, params, i, items);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = AST;

//  ---------------------------------------------------------------------------------------------------------------  //

