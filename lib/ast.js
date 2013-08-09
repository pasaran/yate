var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./scope.js');
require('./types.js');

//  ---------------------------------------------------------------------------------------------------------------  //

require('no.colors');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.error = function(s) {
    var pos = this.where;
    throw new Error( 'ERROR: ' + s + '\n' + pos.input.where(pos) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.make = function(id, params) {
    var ast = this.factory.make(id, this.where, params);

    ast.w_setScope();

    ast.rid = this.rid;
    ast.cid = this.cid;

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.trigger = function(event, params) {
    var handlers = this.options.events[event];

    var stop;
    var r;

    if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
            r = handlers[i].call(this, params);
            if (r === false) {
                stop = true;
            }
        }
    }

    if (!stop) {
        this.apply(function(ast, params) {
            ast.trigger(event, params);
        }, params);
    }

    return r;
};

yate.AST.prototype.apply = function(callback, params) {
    var props = this.p;
    for (var key in props) {
        var child = props[key];
        if (child instanceof yate.AST) {
            callback(child, params);
        }
    }
};

yate.AST.prototype.walkdo = function(callback, params, pKey, pObject) {
    var props = this.p;
    for (var key in props) {
        var child = props[key];
        if (child instanceof yate.AST) {
            child.walkdo(callback, params, key, props);
        }
    }

    callback(this, params, pKey, pObject);
};

yate.AST.prototype.dowalk = function(callback, params, pKey, pObject) {
    callback(this, params, pKey, pObject);

    var props = this.p;
    for (var key in props) {
        var child = props[key];
        if (child instanceof yate.AST) {
            child.dowalk(callback, params, key, props);
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.w_setParents = function(parent) {
    this.parent = parent || null;
    var that = this;
    this.apply(function(ast, parent) {
        ast.w_setParents(that);
    });
};

yate.AST.prototype.is = function(type) {
    for (var i = 0, l = arguments.length; i < l; i++) {
        if ( this instanceof this.factory.get( arguments[i] ) ) {
            return true;
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.toString = function() {
    var r = [];
    for (var key in this) {
        if ( !/^[A-Z]/.test(key) ) { continue; }

        var child = this[key];
        //if (child !== undefined) {
            if (child instanceof yate.AST) {
                var s = child.toString();
                if (s) {
                    r.push( key.blue + ': ' + s);
                }
            } else {
                r.push( key.blue + ': ' + JSON.stringify(child).lime );
            }
        //}
    }
    if (r.length) {
        /*
        var s = this.id.bold + '( ' + this.getType().lime;
        if (this.AsType) {
            s += ' -> '.lime + this.AsType.lime;
        }
        s += ' )\n' + r.join('\n').replace(/^/gm, '    ');
       */
        var s = this.id + '\n' + r.join('\n').replace(/^/gm, '    ');

        return s;
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.state = {
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
// Type methods
//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.getType = function(to) {
    var type = this.__type;
    if (type === undefined) {
        type = this.__type = this._getType();
    }

    return (to) ? yate.types.convertable(type, to) : type;
};

yate.AST.prototype._getType = function() {
    return 'none';
};

yate.AST.prototype.cast = function(to) {
    var from = this.getType();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if ( !yate.types.convertable(from, to) ) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.p.AsType = to;
    }
};

yate.AST.prototype.oncast = no.nop;

yate.AST.prototype.inline = no.false;

yate.AST.prototype.isSimple = no.false;

yate.AST.prototype.isConst = no.false;

yate.AST.prototype.isGlobal = function() {
    return !this.scope.parent;
};

//  ---------------------------------------------------------------------------------------------------------------  //
// Walk methods
//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.w_setScope = function() {
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

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.setAsList = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.rid = function() {
    var rid = this.p.Rid + 1;
    this.dowalk(function(ast) {
        ast.p.Rid = rid;
    });
};

yate.AST.prototype.cid = function() {
    var cid = this.p.Cid + 1;
    this.dowalk(function(ast) {
        ast.p.Cid = cid;
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.opens = no.false;

yate.AST.prototype.closes = no.true;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

yate.AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

yate.AST.prototype.w_deinclude = no.nop;
yate.AST.prototype.w_deimport = no.nop;
yate.AST.prototype.w_deitemize = no.nop;

yate.AST.prototype.w_action = no.nop;
yate.AST.prototype.w_list = no.nop;
yate.AST.prototype.w_validate = no.nop;
yate.AST.prototype.w_prepare = no.nop;
yate.AST.prototype.w_extractDefs = no.nop;
yate.AST.prototype.w_transform = no.nop;
yate.AST.prototype.w_setTypes = no.nop;

yate.AST.prototype.setPrevOpened = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

var templatesDir = path_.join(__dirname, '../templates/');

//  yate.AST.js = new pt.Codegen( 'js', path_.join(templatesDir, 'js.tmpl') );
//  yate.AST.yate = new pt.Codegen( 'yate', path_.join(templatesDir, 'yate.tmpl') );

yate.AST.prototype._code = function(lang, mode) {
    return yate.AST[lang].generate(this.id, this, mode);
};

yate.AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.serialize = function(ast) {
    return JSON.stringify({
        version: yate.version,
        filename: ast.where.input.filename,
        ast: yate.AST.toJSON(ast)
    });
};

yate.AST.deserialize = function(obj) {
    var filename = obj.filename;
    //  var input = new pt.InputStream( { filename: filename } );

    return yate.AST.fromJSON(obj.ast, input);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.toJSON = function(ast) {
    if (!ast || typeof ast !== 'object') {
        return ast;
    }

    var r = {};

    r.id = ast.id;
    r.x = ast.where.x;
    r.y = ast.where.y;

    var props = r.p = {};
    for (var key in ast.p) {
        var value = ast.p[key];
        if (value instanceof Array) {
            var a = props[key] = [];
            for (var i = 0, l = value.length; i < l; i++) {
                a.push( yate.AST.toJSON( value[i] ) );
            }
        } else {
            props[key] = yate.AST.toJSON(value);
        }
    }

    return r;
};

yate.AST.fromJSON = function(obj, input) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    var where = {
        x: obj.x,
        y: obj.y,
        input: input
    };

    var ast = yate.factory.make(obj.id, where);

    var props = ast.p;
    for (var key in obj.p) {
        var value = obj.p[key];
        if (value instanceof Array) {
            var a = props[key] = [];
            for (var i = 0, l = value.length; i < l; i++) {
                a.push( yate.AST.fromJSON(value[i], input) );
            }
        } else {
            props[key] = yate.AST.fromJSON(value, input);
        }
    }

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

