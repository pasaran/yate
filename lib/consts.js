var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate.consts
//  ---------------------------------------------------------------------------------------------------------------  //

yate.consts = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.consts.shortTags = {
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

yate.consts.internalFunctions = {

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

    'string': [
        {
            type: 'scalar',
            args: [ 'nodeset' ]
        },
        {
            type: 'scalar',
            args: [ 'scalar' ]
        },
        {
            type: 'scalar',
            args: [ 'boolean' ]
        }
    ],

    'boolean': {
        type: 'boolean',
        args: [ 'boolean' ]
    },

    'scalar': {
        type: 'scalar',
        args: [ 'scalar' ]
    },

    'log': {
        type: 'xml',
        args: [ '...any' ]
    },

    'document': {
        type: 'nodeset',
        args: [ 'nodeset' ]
    },

    'subnode': [
        {
            type: 'nodeset',
            args: [ 'scalar', 'object' ]
        },
        {
            type: 'nodeset',
            args: [ 'scalar', 'array' ]
        },
        {
            type: 'nodeset',
            args: [ 'scalar', 'scalar' ]
        }
    ]

};

//  ---------------------------------------------------------------------------------------------------------------  //

