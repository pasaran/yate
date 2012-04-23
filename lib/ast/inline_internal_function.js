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

// FIXME: Не место этому здесь.
AST.internalFunctions = {
    'true': AST.make('inline_internal_function', 'true', 'boolean'),
    'false': AST.make('inline_internal_function', 'false', 'boolean'),
    'name': AST.make('inline_internal_function', 'name', 'scalar'),
    'index': AST.make('inline_internal_function', 'index', 'scalar'),
    'count': AST.make('inline_internal_function', 'count', 'scalar'),
    'slice': AST.make('inline_internal_function', 'slice', 'scalar', [ 'scalar', 'scalar', 'scalar' ]),
    'html': AST.make('inline_internal_function', 'html', 'xml', [ 'scalar' ])
};

