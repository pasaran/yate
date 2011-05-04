// ----------------------------------------------------------------------------------------------------------------- //

// TYPES

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Types = {
    NONE: null,
    UNDEF: 'undef',
    SCALAR: 'scalar',
    BOOLEAN: 'boolean',
    NODESET: 'nodeset',
    XML: 'xml',
    ATTR: 'attr',
    PAIR: 'pair'
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Types.joinType = function(left, right) {
    var types = Yate.Types;

    // ATTR + ATTR == ATTR, PAIR + PAIR == PAIR.
    if (left == right && (left == types.ATTR || left == types.PAIR)) { return left; }

    // PAIR ни с чем, кроме PAIR не джойнится.
    if (left == types.PAIR || right == types.PAIR) { return types.NONE; }

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
        (from == types.XML && to == types.SCALAR) ||
        (from == types.ATTR && to == types.XML)
    );
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Types.commonType = function(left, right) {
    if (left == right) { return left; }

    if (left == Yate.Types.BOOL || right == Yate.Types.BOOL) {
        return Yate.Types.BOOL;
    }

    if (left == Yate.Types.XML || left == Yate.Types.ATTR || right == Yate.Types.XML || right == Yate.Types.ATTR) {
        return Yate.Types.XML;
    }

    return Yate.Types.SCALAR;
};

// ----------------------------------------------------------------------------------------------------------------- //

