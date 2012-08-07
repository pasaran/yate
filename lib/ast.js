var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var common = require('parse-tools/common.js');
var baseAST = require('parse-tools/ast.js');
var Codegen = require('parse-tools/codegen.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

require('./scope.js');
require('./types.js');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST = function() {};

common.inherit(yate.AST, baseAST);

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

//  FIXME: Как бы так сделать, чтобы доопределить этот метод (см. ast.js),
//  а не переопределять его полностью?
yate.AST.prototype.make = function(id, params) {
    var ast = this.factory.make(id, this.where, params);

    ast.setScope();
    ast.p.Rid = this.p.Rid;
    ast.p.Cid = this.p.Cid;

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //
// Type methods
//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.type = function(to) {
    var type = this._type;
    if (type === undefined) {
        type = this._type = this._getType();
    }

    return (to) ? yate.types.convertable(type, to) : type;
};

yate.AST.prototype._getType = function() {
    return 'none';
};

yate.AST.prototype.cast = function(to) {
    var from = this.type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if ( !yate.types.convertable(from, to) ) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.p.AsType = to;
    }
};

yate.AST.prototype.oncast = common.nop;

yate.AST.prototype.inline = common.false;

yate.AST.prototype.isSimple = common.false;

yate.AST.prototype.isConst = common.false;

yate.AST.prototype.isGlobal = function() {
    return !this.scope.parent;
};

//  ---------------------------------------------------------------------------------------------------------------  //
// Walk methods
//  ---------------------------------------------------------------------------------------------------------------  //

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

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.rid = function() {
    var rid = this.p.Rid + 1;
    this.walkBefore(function(ast) {
        ast.p.Rid = rid;
    });
};

yate.AST.prototype.cid = function() {
    var cid = this.p.Cid + 1;
    this.walkBefore(function(ast) {
        ast.p.Cid = cid;
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.opens = common.false;

yate.AST.prototype.closes = common.true;

//  ---------------------------------------------------------------------------------------------------------------  //

yate.AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

yate.AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

yate.AST.prototype.deinclude = common.nop;
yate.AST.prototype.action = common.nop;
yate.AST.prototype.validate = common.nop;
yate.AST.prototype.prepare = common.nop;
yate.AST.prototype.extractDefs = common.nop;
yate.AST.prototype.transform = common.nop;
yate.AST.prototype.setTypes = common.nop;
yate.AST.prototype.setPrevOpened = common.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

var templatesDir = path_.join(__dirname, '../templates/');

yate.AST.js = new Codegen( 'js', path_.join(templatesDir, 'js.tmpl') );
yate.AST.yate = new Codegen( 'yate', path_.join(templatesDir, 'yate.tmpl') );

yate.AST.prototype._code = function(lang, mode) {
    return yate.AST[lang].generate(this.id, this, mode);
};

yate.AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

