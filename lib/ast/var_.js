var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.var_ = {};

AST.var_.action = function() {
    var vars = this.scope.vars;
    var name = this.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    this.Vid = this.state.vid++;
    this.Type = AST.var_type.USER;

    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.Lazy = true;
    }

    vars[name] = this;
};

AST.var_._getType = function() {
    return this.Value.type();
};

AST.var_.setTypes = function() {
    this.Value.cast();
};

AST.var_.prepare = function() {
    this.Value.rid();
};

AST.var_.extractDefs = function() {
    this.scope.defs.push(this);
};

