//  ---------------------------------------------------------------------------------------------------------------  //
//  AST
//  ---------------------------------------------------------------------------------------------------------------  //

var common = require('./common.js');
var codegen = require('./codegen.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var AST = function() {};

AST.prototype._init = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: А это зачем?
AST.prototype.options = {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.error = function(s) {
    var pos = this.where;
    throw new Error( 'ERROR: ' + s + '\n' + pos.input.where(pos) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.make = function(id, params) {
    var ast = this.factory.make(id, params);
    ast.parent = this;
    /*
    ast.setScope();
    ast.Rid = this.Rid;
    ast.Cid = this.Cid;
    */
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
    //  FIXME: Где это вообще применяется?
    if (type instanceof Array) {
        for (var i = 0, l = type.length; i < l; i++) {
            if (this instanceof this.factory.get( type[i]) ) {
                return true;
            }
        }
    } else {
        return this instanceof this.factory.get(type);
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

    var result = codegen(lang, data.id, mode, data);
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

module.exports = AST;

//  ---------------------------------------------------------------------------------------------------------------  //

