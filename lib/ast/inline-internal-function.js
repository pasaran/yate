// FIXME: Переименовать в inline-...

Yate.AST.internalFunctions = {
    'true': Yate.AST.make('internalFunction', 'true', Yate.Types.BOOLEAN),
    'false': Yate.AST.make('internalFunction', 'false', Yate.Types.BOOLEAN),
    'name': Yate.AST.make('internalFunction', 'name', Yate.Types.SCALAR),
    'position': Yate.AST.make('internalFunction', 'position', Yate.Types.SCALAR),
    'count': Yate.AST.make('internalFunction', 'count', Yate.Types.SCALAR),
    'slice': Yate.AST.make('internalFunction', 'slice', Yate.Types.SCALAR, [ Yate.Types.SCALAR, Yate.Types.SCALAR, Yate.Types.SCALAR ])
};

Yate.AST.internalFunction = {

    _init: function(name, type, argTypes) {
        this.Name = name;
        this._type = type;
        this._argTypes = argTypes || [];
        this.Type = Yate.AST.functionType.INTERNAL;
    }

};

