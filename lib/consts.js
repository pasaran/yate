var consts = {};

consts.internalFunctions = {
    'true': AST.make('inline_internal_function', 'true', 'boolean'),
    'false': AST.make('inline_internal_function', 'false', 'boolean'),
    'name': AST.make('inline_internal_function', 'name', 'scalar'),
    'index': AST.make('inline_internal_function', 'index', 'scalar'),
    'count': AST.make('inline_internal_function', 'count', 'scalar'),
    'slice': AST.make('inline_internal_function', 'slice', 'scalar', [ 'scalar', 'scalar', 'scalar' ]),
    'html': AST.make('inline_internal_function', 'html', 'xml', [ 'scalar' ])
};

