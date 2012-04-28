var consts = {};

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

consts.internalFunctions = {
    'true': {
        name: 'true',
        type: 'boolean'
    },
    'false': {
        name: 'false',
        type: 'boolean'
    },
    'name': {
        name: 'name',
        type: 'scalar'
    },
    'index': {
        name: 'index',
        type: 'scalar'
    },
    'count': {
        name: 'count',
        type: 'scalar'
    },
    'slice': {
        name: 'slice',
        type: 'scalar',
        argTypes: [ 'scalar', 'scalar', 'scalar' ]
    },
    'html': {
        name: 'html',
        type: 'xml',
        argTypes: [ 'scalar' ]
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = consts;

//  ---------------------------------------------------------------------------------------------------------------  //

