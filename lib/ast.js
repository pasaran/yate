var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var path_ = require('path');

require('no.colors');

//  ---------------------------------------------------------------------------------------------------------------  //

var Scope = require('./scope.js');
var types = require('./types.js');

var Codegen = require('./codegen.js');

//  ---------------------------------------------------------------------------------------------------------------  //

function AST() {}

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.error = function(msg) {
    yate.error(msg, this.pos);
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.make = function(id, params) {
    return this.factory.make(id, this.pos, params);
};

AST.prototype.child = function(id, params) {
    var ast = this.make(id, params);

    ast.parent = this;

    ast.rid = this.rid;
    ast.cid = this.cid;

    ast.w_set_scope();

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.clone = function() {
    return this.factory.make(this.id, this.pos);
};

AST.prototype.copy = yate.nop;

AST.prototype.apply = yate.nop;

AST.prototype.dowalk = function(callback, params) {
    callback(this, params);
};

AST.prototype.walkdo = function(callback, params) {
    callback(this, params);
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.is = function(type) {
    for (var i = 0, l = arguments.length; i < l; i++) {
        if ( this instanceof this.factory.get( arguments[i] ) ) {
            return true;
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.toString = function() {
    var r = [];
    for (var key in this) {
        if ( !/^[A-Z]/.test(key) ) { continue; }

        var child = this[key];
        if (child != null) {
            if (child instanceof AST) {
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
        var s = this.id + '\n' + r.join('\n').replace(/^/gm, '    ');
        //  var s = this.id + ': ' + this.get_type().teal + '\n' + r.join('\n').replace(/^/gm, '    ');

        return s;
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.state = {
    //  Глобальные id-шники:

    //  jpath'ы.
    jid: 1,
    //  Предикаты.
    pid: 1,
    //  Шаблоны.
    tid: 1,
    //  Переменные.
    vid: 1,
    //  Функции.
    fid: 1,
    //  Ключи.
    kid: 1

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Методы про типы и их приведение.

AST.prototype.get_type = function(to) {
    var type = this.__type;
    if (type === undefined) {
        type = this.__type = this._get_type();
    }

    return (to) ? types.is_convertable(type, to) : type;
};

AST.prototype._get_type = function() {
    return 'none';
};

AST.prototype.cast = function(to) {
    var from = this.get_type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if ( !types.is_convertable(from, to) ) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.as_type = to;
    }
};

AST.prototype.oncast = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.is_inline = yate.false;

AST.prototype.is_simple = yate.false;

AST.prototype.is_const = yate.false;

AST.prototype.is_global = function() {
    return !this.scope.parent;
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.get_scope = function() {
    return this.scope.top();
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.set_as_list = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.rid = 0;

AST.prototype.cid = 0;

//  FIXME: Не нужно обходить все поддерево на каждый inc_rid/inc_cid.
//  Правильнее, запоминать инкримент и потом один раз пройти по всему дереву
//  и пересчитать rid/cid.

AST.prototype.inc_rid = function() {
    var rid = this.rid + 1;
    this.dowalk(function(ast) {
        ast.rid = rid;
    });
};

AST.prototype.inc_cid = function() {
    var cid = this.cid + 1;
    this.dowalk(function(ast) {
        ast.cid = cid;
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.opens = yate.false;

AST.prototype.closes = yate.true;

//  ---------------------------------------------------------------------------------------------------------------  //

//  Хождение по дереву.

AST.prototype.w_deinclude = yate.nop;

AST.prototype.w_deimport = yate.nop;

AST.prototype.w_deitemize = yate.nop;

AST.prototype.w_set_scope = function() {
    var parent = this.parent;

    var scope = (parent) ? parent.scope : null;
    if (this.options.scope) {
        scope = (scope) ? scope.child() : new Scope();
    }

    this.scope = scope;
};

AST.prototype.w_action = yate.nop;

AST.prototype.w_list = yate.nop;

AST.prototype.w_validate = yate.nop;

AST.prototype.w_set_types = yate.nop;

AST.prototype.w_extract_defs = yate.nop;

AST.prototype.w_prepare = yate.nop;

AST.prototype.w_transform = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.set_prev_opened = yate.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

//  Кодогенерация.

var templates_dir = path_.join(__dirname, '../templates/');

AST.js = new Codegen( 'js', path_.join(templates_dir, 'js.tmpl') );
AST.yate = new Codegen( 'yate', path_.join(templates_dir, 'yate.tmpl') );

AST.prototype._code = function(lang, mode) {
    return AST[lang].generate(this.id, this, mode);
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

//  ---------------------------------------------------------------------------------------------------------------  //

/*

AST.serialize = function(ast) {
    return JSON.stringify({
        version: yate.version,
        filename: ast.where.input.filename,
        ast: AST.to_json(ast)
    });
};

AST.deserialize = function(obj) {
    var filename = obj.filename;
    //  var input = new pt.InputStream( { filename: filename } );

    return AST.from_json(obj.ast, input);
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.to_json = function(ast) {
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
                a.push( AST.to_json( value[i] ) );
            }
        } else {
            props[key] = AST.to_json(value);
        }
    }

    return r;
};

AST.from_json = function(obj, input) {
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
                a.push( AST.from_json(value[i], input) );
            }
        } else {
            props[key] = AST.from_json(value, input);
        }
    }

    return ast;
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = AST;

//  ---------------------------------------------------------------------------------------------------------------  //


