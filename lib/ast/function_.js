var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.function_ = {};

AST.function_.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.Fid = this.state.fid++;
    this.Type = AST.function_type.USER;

    functions[name] = this;
};

AST.function_.validate = function() {
    if (this.Body.type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

AST.function_._getType = function() {
    return this.Body.type();
};

AST.function_.setTypes = function() {
    this.Body.cast();
};

AST.function_.extractDefs = function() {
    this.scope.defs.push(this);
};

