var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  types
//  ---------------------------------------------------------------------------------------------------------------  //

var types = {};

//  ---------------------------------------------------------------------------------------------------------------  //

types.joinType = function(left, right) {
    //  NONE + ??? == NONE
    if (left == 'none' || right == 'none') { return 'none'; }

    //  ARRAY + ??? == NONE, OBJECT + ??? == NONE, BOOLEAN + ??? == NONE
    if (left == 'array' || right == 'array') { return 'none'; }
    if (left == 'object' || right == 'object') { return 'none'; }
    if (left == 'boolean' || right == 'boolean') { return 'none'; }

    //  UNDEF + UNDEF == UNDEF
    if (left == 'undef' && right == 'undef') { return 'undef'; }

    //  PAIR + ??? == PAIR
    if (left == 'pair' || right == 'pair') { return 'pair'; }

    //  ATTR + ATTR == ATTR
    if (left == 'attr' && right == 'attr') { return 'attr'; }

    //  ATTR + ??? == XML, XML + ??? == XML.
    if (left == 'xml' || left == 'attr' || right == 'xml' || right == 'attr') { return 'xml'; }

    //  LIST + LIST == LIST
    if (left == 'list' && right == 'list') { return 'list'; }

    //  Все остальное это SCALAR.
    return 'scalar';
};

//  ---------------------------------------------------------------------------------------------------------------  //

types.convertable = function(from, to) {
    return (
        (from == to) ||
        (from == 'undef') ||
        (from == 'nodeset' && to == 'scalar') ||
        (from == 'nodeset' && to == 'xml') ||
        (from == 'nodeset' && to == 'attrvalue') ||
        (from == 'nodeset' && to == 'boolean') ||
        (from == 'scalar' && to == 'boolean') ||
        (from == 'scalar' && to == 'xml') ||
        (from == 'xml' && to == 'scalar') ||
        (from == 'scalar' && to == 'attrvalue') ||
        (from == 'attr' && to == 'xml')
    );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Этот метод используется только в if_._getType. Унести его туда.
types.commonType = function(left, right) {
    if (left == right) { return left; }

    if (left == 'undef') { return right; }
    if (right == 'undef') { return left; }

    if (
        left == 'array' || right == 'array' ||
        left == 'object' || right == 'object' ||
        left == 'pair' || right == 'pair'
    ) {
        return 'none';
    }

    if (left == 'boolean' || right == 'boolean') {
        return 'boolean';
    }

    if (
        left == 'xml' || right == 'xml' ||
        left == 'attr' || right == 'attr'
    ) {
        return 'xml';
    }

    return 'scalar';
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = types;

//  ---------------------------------------------------------------------------------------------------------------  //

