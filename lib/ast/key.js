var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.key = {};

AST.key.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.Kid = this.state.kid++;
    this.Type = AST.function_type.KEY;

    functions[name] = this;
};

AST.key.validate = function() {
    if (!this.Nodes.type( 'nodeset' )) {
        this.Nodes.error('Nodeset is required');
    }
    if (!this.Use.type( 'scalar' )) {
        this.Use.error('Scalar is required');
    }
};

AST.key._getType = function() {
    return this.Body.type();
};

AST.key.prepare = function() {
    this.Body.cast();
};

AST.key.extractDefs = function() {
    this.scope.defs.push(this);
};

