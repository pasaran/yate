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
        type: 'boolean'
    },

    'false': {
        type: 'boolean'
    },

    'name': [
        {
            type: 'scalar',
            local: true
        },
        {
            type: 'scalar',
            args: [ 'nodeset' ]
        }
    ],

    'index': {
        type: 'scalar',
        local: true
    },

    'count': [
        {
            type: 'scalar',
            local: false
        },
        {
            type: 'scalar',
            args: [ 'nodeset' ]
        }
    ],

    'slice': {
        type: 'scalar',
        args: [ 'scalar', 'scalar', 'scalar' ]
    },

    'html': {
        type: 'xml',
        args: [ 'scalar' ]
    },

    'exists': {
        type: 'boolean',
        args: [ 'nodeset' ]
    },

    'number': {
        type: 'scalar',
        args: [ 'scalar' ]
    },

    'boolean': [
        {
            type: 'boolean',
            args: [ 'scalar' ]
        },
        {
            type: 'boolean',
            args: [ 'boolean' ]
        }
    ]

};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = consts;

//  ---------------------------------------------------------------------------------------------------------------  //

