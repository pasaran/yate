var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./scope.js');
require('./types.js');
require('./codegen.js');

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

    /*
    ast.w_set_scope();

    ast.rid = this.rid;
    ast.cid = this.cid;
    */

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.copy = yate.nop;

yate.AST.prototype.apply = yate.nop;

yate.AST.prototype.dowalk = function(callback, params) {
    callback(this, params);
};

yate.AST.prototype.walkdo = function(callback, params) {
    callback(this, params);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.w_set_parents = function(parent) {
    this.parent = parent;
    this.apply(function(ast, parent) {
        ast.w_set_parents(parent);
    }, this);
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
        if (child != undefined) {
            if (child instanceof yate.AST) {
                var s = child.toString();
                if (s) {
                    r.push( key.blue + ': ' + s);
                }
            } else {
                r.push( key.blue + ': ' + JSON.stringify(child).lime );
            }
        }
    }
    if (r.length) {
        /*
        var s = this.id.bold + '( ' + this.get_type().lime;
        if (this.as_type) {
            s += ' -> '.lime + this.as_type.lime;
        }
        s += ' )\n' + r.join('\n').replace(/^/gm, '    ');
       */
        var s = this.id + ': ' + this.get_type().teal + '\n' + r.join('\n').replace(/^/gm, '    ');

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

yate.AST.prototype.get_type = function(to) {
    var type = this.__type;
    if (type === undefined) {
        type = this.__type = this._get_type();
    }

    return (to) ? yate.types.convertable(type, to) : type;
};

yate.AST.prototype._get_type = function() {
    return 'none';
};

yate.AST.prototype.cast = function(to) {
    var from = this.get_type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if ( !yate.types.convertable(from, to) ) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.as_type = to;
    }
};

yate.AST.prototype.oncast = yate.nop;

yate.AST.prototype.inline = yate.false;

yate.AST.prototype.is_simple = yate.false;

yate.AST.prototype.is_const = yate.false;

yate.AST.prototype.is_global = function() {
    return !this.scope.parent;
};

//  ---------------------------------------------------------------------------------------------------------------  //
// Walk methods
//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.w_set_scope = function() {
    var parent = this.parent;

    var scope = (parent) ? parent.scope : null;
    if (this.options.scope) {
        scope = (scope) ? scope.child() : new yate.Scope();
    }

    if (scope) {
        this.scope = scope;
        this.sid = scope.id;
    }
    //  FIXME: Сейчас получается, что scope нет только у module.
    //  Непонятно, нужен ли он ему или нет.
};

yate.AST.prototype.get_scope = function() {
    return this.scope.top();
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.setAsList = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Не нужно обходить все поддерево на каждый inc_rid/inc_cid.
//  Правильнее, запоминать инкримент и потом один раз пройти по всему дереву
//  и пересчитать rid/cid.

yate.AST.prototype.inc_rid = function() {
    var rid = this.rid + 1;
    this.dowalk(function(ast) {
        ast.rid = rid;
    });
};

yate.AST.prototype.inc_cid = function() {
    var cid = this.cid + 1;
    this.dowalk(function(ast) {
        ast.cid = cid;
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.opens = yate.false;

yate.AST.prototype.closes = yate.true;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

yate.AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

yate.AST.prototype.w_deinclude = yate.nop;
yate.AST.prototype.w_deimport = yate.nop;
yate.AST.prototype.w_deitemize = yate.nop;

yate.AST.prototype.w_action = yate.nop;
yate.AST.prototype.w_list = yate.nop;
yate.AST.prototype.w_validate = yate.nop;
yate.AST.prototype.w_prepare = yate.nop;
yate.AST.prototype.w_extractDefs = yate.nop;
yate.AST.prototype.w_transform = yate.nop;
yate.AST.prototype.w_set_types = yate.nop;

yate.AST.prototype.setPrevOpened = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

var templatesDir = path_.join(__dirname, '../templates/');

yate.AST.js = new yate.Codegen( 'js', path_.join(templatesDir, 'js.tmpl') );
yate.AST.yate = new yate.Codegen( 'yate', path_.join(templatesDir, 'yate.tmpl') );

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
        ast: yate.AST.to_json(ast)
    });
};

yate.AST.deserialize = function(obj) {
    var filename = obj.filename;
    //  var input = new pt.InputStream( { filename: filename } );

    return yate.AST.from_json(obj.ast, input);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.to_json = function(ast) {
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
                a.push( yate.AST.to_json( value[i] ) );
            }
        } else {
            props[key] = yate.AST.to_json(value);
        }
    }

    return r;
};

yate.AST.from_json = function(obj, input) {
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
                a.push( yate.AST.from_json(value[i], input) );
            }
        } else {
            props[key] = yate.AST.from_json(value, input);
        }
    }

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

