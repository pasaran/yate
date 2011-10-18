// FIXME: Переименовать в inline-...

Yate.AST.internal_function = {

    _init: function(name, type, argTypes) {
        this.Name = name;
        this._type = type;
        this._argTypes = argTypes || [];
        this.Type = Yate.AST.function_type.INTERNAL;
    }

};

Yate.AST.internalFunctions = {
    'true': Yate.AST.make('internal_function', 'true', Yate.Types.BOOLEAN),
    'false': Yate.AST.make('internal_function', 'false', Yate.Types.BOOLEAN),
    'name': Yate.AST.make('internal_function', 'name', Yate.Types.SCALAR),
    'position': Yate.AST.make('internal_function', 'position', Yate.Types.SCALAR),
    'count': Yate.AST.make('internal_function', 'count', Yate.Types.SCALAR),
    'slice': Yate.AST.make('internal_function', 'slice', Yate.Types.SCALAR, [ Yate.Types.SCALAR, Yate.Types.SCALAR, Yate.Types.SCALAR ])
};

