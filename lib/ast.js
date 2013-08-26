var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');
var path_ = require('path');

var no = require('nommon');
require('no.colors');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./scope.js');
require('./types.js');
require('./codegen.js');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.error = function(msg, pos) {
    var filename = pos.filename;

    var content = fs_.readFileSync(filename, 'utf-8');
    var lines = content.split('\n');

    var x = pos.x;
    var y = pos.y;
    var line = lines[y] || '';

    var error = '';
    error += msg.red.bold + '\n\n';
    error += '    at ' + filename.lime + ' (line: ' + (y + 1).toString().lime + ' col: ' + (x + 1).toString().lime + ')\n\n';
    error += '    ' + line.blue + '\n    ' + Array(x + 1).join(' ') + '^'.red + '\n';

    throw new Error(error);
};

yate.AST.prototype.error = function(msg) {
    yate.AST.error(msg, this.pos);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.make = function(id, params) {
    return this.factory.make(id, this.pos, params);
};

yate.AST.prototype.child = function(id, params) {
    var ast = this.make(id, params);

    ast.parent = this;

    ast.rid = this.rid;
    ast.cid = this.cid;

    ast.w_set_scope();

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.clone = function() {
    return this.factory.make(this.id, this.pos);
};

yate.AST.prototype.copy = no.nop;

yate.AST.prototype.apply = no.nop;

yate.AST.prototype.dowalk = function(callback, params) {
    callback(this, params);
};

yate.AST.prototype.walkdo = function(callback, params) {
    callback(this, params);
};

//  ---------------------------------------------------------------------------------------------------------------  //

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
        if (child != null) {
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
        var s = this.id + '\n' + r.join('\n').replace(/^/gm, '    ');
        //  var s = this.id + ': ' + this.get_type().teal + '\n' + r.join('\n').replace(/^/gm, '    ');

        return s;
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.state = {
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

yate.AST.prototype.get_type = function(to) {
    var type = this.__type;
    if (type === undefined) {
        type = this.__type = this._get_type();
    }

    return (to) ? yate.types.is_convertable(type, to) : type;
};

yate.AST.prototype._get_type = function() {
    return 'none';
};

yate.AST.prototype.cast = function(to) {
    var from = this.get_type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if ( !yate.types.is_convertable(from, to) ) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.as_type = to;
    }
};

yate.AST.prototype.oncast = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.is_inline = no.false;

yate.AST.prototype.is_simple = no.false;

yate.AST.prototype.is_const = no.false;

yate.AST.prototype.is_global = function() {
    return !this.scope.parent;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.get_scope = function() {
    return this.scope.top();
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.set_as_list = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.rid = 0;

yate.AST.prototype.cid = 0;

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

yate.AST.prototype.opens = no.false;

yate.AST.prototype.closes = no.true;

//  ---------------------------------------------------------------------------------------------------------------  //

//  Хождение по дереву.

yate.AST.prototype.w_deinclude = no.nop;

yate.AST.prototype.w_deimport = no.nop;

yate.AST.prototype.w_deitemize = no.nop;

yate.AST.prototype.w_set_scope = function() {
    var parent = this.parent;

    var scope = (parent) ? parent.scope : null;
    if (this.options.scope) {
        scope = (scope) ? scope.child() : new yate.Scope();
    }

    this.scope = scope;
};

yate.AST.prototype.w_action = no.nop;

yate.AST.prototype.w_list = no.nop;

yate.AST.prototype.w_validate = no.nop;

yate.AST.prototype.w_set_types = no.nop;

yate.AST.prototype.w_extract_defs = no.nop;

yate.AST.prototype.w_prepare = no.nop;

yate.AST.prototype.w_transform = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.set_prev_opened = no.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

//  Кодогенерация.

var templates_dir = path_.join(__dirname, '../templates/');

yate.AST.js = new yate.Codegen( 'js', path_.join(templates_dir, 'js.tmpl') );
yate.AST.yate = new yate.Codegen( 'yate', path_.join(templates_dir, 'yate.tmpl') );

yate.AST.prototype._code = function(lang, mode) {
    return yate.AST[lang].generate(this.id, this, mode);
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

//  ---------------------------------------------------------------------------------------------------------------  //

