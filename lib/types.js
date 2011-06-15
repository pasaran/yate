// ----------------------------------------------------------------------------------------------------------------- //

// TYPES

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Types = {
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

Yate.Types.joinType = function(left, right) {
    var types = Yate.Types;

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

    // Все остальное это SCALAR.
    return types.SCALAR;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Types.convertable = function(from, to) {
    var types = Yate.Types;

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

Yate.Types.commonType = function(left, right) {
    var types = Yate.Types;

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
        left == Yate.Types.XML || right == Yate.Types.XML ||
        left == Yate.Types.ATTR || right == Yate.Types.ATTR
    ) {
        return Yate.Types.XML;
    }

    return Yate.Types.SCALAR;
};

// ----------------------------------------------------------------------------------------------------------------- //

