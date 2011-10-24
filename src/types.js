// ----------------------------------------------------------------------------------------------------------------- //

// TYPES

// ----------------------------------------------------------------------------------------------------------------- //

yate.Types = {
    NONE    : 'none',
    UNDEF   : 'undef',
    SCALAR  : 'scalar',
    BOOLEAN : 'boolean',
    NODESET : 'nodeset',
    XML     : 'xml',
    ATTR    : 'attr',
    PAIR    : 'pair',
    ARRAY   : 'array',
    OBJECT  : 'object',
    LIST    : 'list'
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Types.joinType = function(left, right) {
    var types = yate.Types;

    // NONE + ??? == NONE
    if (left == types.NONE || right == types.NONE) { return types.NONE; }

    // ARRAY + ??? == NONE, OBJECT + ??? == NONE, BOOLEAN + ??? == NONE
    if (left == types.ARRAY || right == types.ARRAY) { return types.NONE; }
    if (left == types.OBJECT || right == types.OBJECT) { return types.NONE; }
    if (left == types.BOOLEAN || right == types.BOOLEAN) { return types.NONE; }

    // UNDEF + UNDEF == UNDEF
    if (left == types.UNDEF && right == types.UNDEF) { return types.UNDEF; }

    // PAIR + ??? == PAIR
    if (left == types.PAIR || right == types.PAIR) { return types.PAIR; }

    // ATTR + ATTR == ATTR
    if (left == types.ATTR && right == types.ATTR) { return types.ATTR; }

    // ATTR + ??? == XML, XML + ??? == XML.
    if (left == types.XML || left == types.ATTR || right == types.XML || right == types.ATTR) { return types.XML; }

    // LIST + LIST == LIST
    if (left == types.LIST && right == types.LIST) { return types.LIST; }

    // Все остальное это SCALAR.
    return types.SCALAR;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Types.convertable = function(from, to) {
    var types = yate.Types;

    return (
        (from == to) ||
        (from == types.UNDEF) ||
        (from == types.NODESET && to == types.SCALAR) ||
        (from == types.NODESET && to == types.XML) ||
        (from == types.NODESET && to == types.BOOLEAN) ||
        (from == types.SCALAR && to == types.BOOLEAN) ||
        (from == types.SCALAR && to == types.XML) ||
        // (from == types.XML && to == types.SCALAR) ||
        (from == types.ATTR && to == types.XML)
    );
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Types.commonType = function(left, right) {
    var types = yate.Types;

    if (left == right) { return left; }

    if (left == types.UNDEF) { return right; }
    if (right == types.UNDEF) { return left; }

    if (
        left == types.ARRAY || right == types.ARRAY ||
        left == types.OBJECT || right == types.OBJECT ||
        left == types.PAIR || right == types.PAIR
    ) {
        return types.NONE;
    }

    if (left == types.BOOLEAN || right == types.BOOLEAN) {
        return types.BOOLEAN;
    }

    if (
        left == yate.Types.XML || right == yate.Types.XML ||
        left == yate.Types.ATTR || right == yate.Types.ATTR
    ) {
        return yate.Types.XML;
    }

    return yate.Types.SCALAR;
};

// ----------------------------------------------------------------------------------------------------------------- //

