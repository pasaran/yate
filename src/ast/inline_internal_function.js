yate.AST.inline_internal_function = {

    _init: function(name, type, argTypes) {
        this.Name = name;
        this._type = type;
        this._argTypes = argTypes || [];
        this.Type = yate.AST.function_type.INTERNAL;
    }

};

yate.AST.internalFunctions = {
    'true': yate.AST.make('inline_internal_function', 'true', yate.Types.BOOLEAN),
    'false': yate.AST.make('inline_internal_function', 'false', yate.Types.BOOLEAN),
    'name': yate.AST.make('inline_internal_function', 'name', yate.Types.SCALAR),
    'position': yate.AST.make('inline_internal_function', 'position', yate.Types.SCALAR),
    'count': yate.AST.make('inline_internal_function', 'count', yate.Types.SCALAR),
    'slice': yate.AST.make('inline_internal_function', 'slice', yate.Types.SCALAR, [ yate.Types.SCALAR, yate.Types.SCALAR, yate.Types.SCALAR ])
};

