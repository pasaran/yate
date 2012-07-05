var path_ = require('path');

var common = require('parse-tools/common.js');
var baseAST = require('parse-tools/ast.js');
var Codegen = require('parse-tools/codegen.js');

var Scope = require('./scope.js');
var types = require('./types.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var AST = function() {};

common.inherit(AST, baseAST);

//  ---------------------------------------------------------------------------------------------------------------  //

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

//  FIXME: Как бы так сделать, чтобы доопределить этот метод (см. ast.js),
//  а не переопределять его полностью?
AST.prototype.make = function(id, params) {
    var ast = this.factory.make(id, params);
    ast.parent = this;
    ast.setScope();
    ast.Rid = this.Rid;
    ast.Cid = this.Cid;
    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //
// Type methods
//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.type = function(to) {
    var type = this._type;
    if (type === undefined) {
        type = this._type = this._getType();
    }

    return (to) ? types.convertable(type, to) : type;
};

AST.prototype._getType = function() {
    return 'none';
};

AST.prototype.cast = function(to) {
    var from = this.type();
    to = to || from;

    var r = this.oncast(to);
    if (from !== to && r !== false) {
        if (!types.convertable(from, to)) {
            this.error( 'Cannot convert type from ' + from + ' to ' + to + ' ' + this.id );
        }

        this.AsType = to;
    }
};

AST.prototype.oncast = common.nop;

AST.prototype.inline = common.false;

AST.prototype.isSimple = common.false;

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

AST.prototype.opens = common.false;

AST.prototype.closes = common.true;

//  ---------------------------------------------------------------------------------------------------------------  //

AST.prototype.js = function(mode) {
    return this.code('js', mode);
};

AST.prototype.yate = function(mode) {
    return this.code('yate', mode);
};

AST.prototype.action = common.nop;
AST.prototype.validate = common.nop;
AST.prototype.prepare = common.nop;
AST.prototype.extractDefs = common.nop;
AST.prototype.transform = common.nop;
AST.prototype.setTypes = common.nop;
AST.prototype.setPrevOpened = common.nop;

//  ---------------------------------------------------------------------------------------------------------------  //

var templatesDir = path_.join(__dirname, '../templates/');

AST.js = new Codegen( 'js', path_.join(templatesDir, 'js.tmpl') );
AST.yate = new Codegen( 'yate', path_.join(templatesDir, 'yate.tmpl') );

AST.prototype._code = function(lang, mode) {
    return AST[lang].generate(this.id, this, mode);
};

AST.prototype.code = function(lang, mode) {
    mode = mode || '';

    return this._code(lang, mode) || '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = AST;

//  ---------------------------------------------------------------------------------------------------------------  //

