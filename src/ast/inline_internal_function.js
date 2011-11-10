yate.AST.inline_internal_function = {};

yate.AST.inline_internal_function._init = function(name, type, argTypes) {
    this.Name = name;
    this._type = type;
    this._argTypes = argTypes || [];
    this.Type = yate.AST.function_type.INTERNAL;
};

// FIXME: Не место этому здесь.
yate.AST.internalFunctions = {
    'true': yate.AST.make('inline_internal_function', 'true', 'boolean'),
    'false': yate.AST.make('inline_internal_function', 'false', 'boolean'),
    'name': yate.AST.make('inline_internal_function', 'name', 'scalar'),
    'position': yate.AST.make('inline_internal_function', 'position', 'scalar'),
    'count': yate.AST.make('inline_internal_function', 'count', 'scalar'),
    'slice': yate.AST.make('inline_internal_function', 'slice', 'scalar', [ 'scalar', 'scalar', 'scalar' ])
};

