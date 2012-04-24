var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_internal_function = {};

AST.inline_internal_function._init = function(name, type, argTypes) {
    this.Name = name;
    this._type = type;
    this._argTypes = argTypes || [];
    this.Type = AST.function_type.INTERNAL;
};

