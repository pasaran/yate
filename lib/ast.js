var yate = require('./yate.js');
var Scope = require('./scope.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  Base AST class.
//  ---------------------------------------------------------------------------------------------------------------  //

function AST() {};

AST.prototype._init = function() {};

AST._asts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.options = {};

AST.prototype.Rid = 0;
AST.prototype.Cid = 0;

AST.prototype.state = {
    //  Глобальные id-шники:

    //  jpath'ы.
    jid: 0,
    //  Предикаты.
    pid: 0,
    //  Шаблоны.
    tid: 0,
    //  Переменные.
    vid: 0,
    //  Функции.
    fid: 0,
    //  Ключи.
    kid: 0

};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.error = function(s) {
    // require('util').puts(new Error().stack);
    var pos = this.where;
    throw new Error( 'ERROR: ' + s + '\n' + pos.input.where(pos) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.make = function(id) {
    var ast = new (AST.$(id))();
    ast.id = id; // Если делать это в прототипе, то не видно в console.log.
    ast._init.apply(ast, Array.prototype.slice.call(arguments, 1));
    return ast;
};

AST.prototype.make = function() {
    var ast = AST.make.apply(null, arguments);
    ast.parent = this;
    ast.setScope();
    ast.Rid = this.Rid;
    ast.Cid = this.Cid;
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
            options.mixin = yate.makeArray(options.mixin);
            mixin = mixin.concat( options.mixin.map( function(id) { return AST[id] || {}; } ) );
        }
        mixin.push(info);
        yate.inherit(ast, base, mixin);

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

//  ---------------------------------------------------------------------------------------------------------------  //
// Type methods
//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.type = function(to) {
    var type = this._type;
    if (type === undefined) {
        type = this._type = this._getType();
    }

    return (to) ? yate.types.convertable(type, to) : type;
};

AST.prototype._getType = function() {
    return 'none';
};

AST.prototype.cast = function(to) {
    var from = this.type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if (!yate.types.convertable(from, to)) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.AsType = to;
    }
};

AST.prototype.oncast = yate.nop;

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

AST.prototype.inline = yate.false;

//  ---------------------------------------------------------------------------------------------------------------  //
// Walk methods
//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.setScope = function() {
    var parent = this.parent;

    var scope = (parent) ? parent.scope : null;
    if (this.options.scope) {
        scope = (scope) ? scope.child() : new Scope();
    }

    if (scope) {
        this.scope = scope;
        this.Sid = scope.id;
    }
};

AST.prototype.getScope = function() {
    return this.scope.top();
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.log = function() {
    // console.log(this.id);
    return require('util').inspect(this, true, null);
};

//  ---------------------------------------------------------------------------------------------------------------  //

/*
AST.prototype.set = function(key, value) {
    this.trigger(function() {
        this[key] = value;
    });
};
*/

AST.prototype.rid = function() {
    var rid = this.Rid + 1;
    this.walkBefore(function(ast) {
        ast.Rid = rid;
    });
};

AST.prototype.cid = function() {
    var cid = this.Cid + 1;
    this.walkBefore(function(ast) {
        ast.Cid = cid;
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.opens = yate.false;

AST.prototype.closes = yate.true;

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

// FIXME: Унести в ast/var_.js и ast/function_.js соответственно.

AST.var_type = {
    USER: 'user',
    ARGUMENT: 'argument'
};

AST.function_type = {
    USER: 'user',
    INTERNAL: 'internal',
    EXTERNAL: 'external',
    KEY: 'key'
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

AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};

AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

AST.prototype.action = yate.nop;
AST.prototype.validate = yate.nop;
AST.prototype.prepare = yate.nop;
AST.prototype.extractDefs = yate.nop;
AST.prototype.transform = yate.nop;
AST.prototype.setTypes = yate.nop;
AST.prototype.setPrevOpened = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.shortTags = { // FIXME: Унести это куда-нибудь.
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

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = AST;

//  ---------------------------------------------------------------------------------------------------------------  //

