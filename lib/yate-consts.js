var ASTS = require('./yate-asts.js');

var consts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

/*
consts.internalFunctions = {
    'true': ASTS.make('inline_internal_function', 'true', 'boolean'),
    'false': ASTS.make('inline_internal_function', 'false', 'boolean'),
    'name': ASTS.make('inline_internal_function', 'name', 'scalar'),
    'index': ASTS.make('inline_internal_function', 'index', 'scalar'),
    'count': ASTS.make('inline_internal_function', 'count', 'scalar'),
    'slice': ASTS.make('inline_internal_function', 'slice', 'scalar', [ 'scalar', 'scalar', 'scalar' ]),
    'html': ASTS.make('inline_internal_function', 'html', 'xml', [ 'scalar' ])
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

consts.shortTags = {
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    wbr: true
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = consts;

//  ---------------------------------------------------------------------------------------------------------------  //

