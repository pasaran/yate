// ----------------------------------------------------------------------------------------------------------------- //
// yate.AST.items
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items = {};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items._init = function(items) {
    this.Items = yate.makeArray(items || []);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items._getType = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return yate.types.SCALAR; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var currentId = items[0].id;
    var currentType = items[0].type();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var nextType = item.type();

        var commonType = yate.types.joinType(currentType, nextType);
        if (commonType == yate.types.NONE) {
            item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
        }
        currentId = item.id;
        currentType = commonType;
    };

    return currentType;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.add = function(item) {
    this.Items.push(item);
};

yate.AST.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

yate.AST.items.empty = function() {
    return (this.Items.length == 0);
};

yate.AST.items.iterate = function(callback) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], i);
    }
};

yate.AST.items.grep = function(callback) {
    var items = this.Items;
    var r = [];
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (callback(item, i)) {
            r.push(item);
        }
    }
    return r;
};

yate.AST.items.map = function(callback) {
    return yate.map(this.Items, callback);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.code = function(lang, mode) {
    mode = mode || '';

    var result = this._code(lang, mode);
    if (result !== undefined) {
        return result;
    }

    var r = [];

    this.iterate(function(item) {
        r.push( item.code(lang, mode) );
    });

    // Пробуем this.jssep$mode(), затем this.codesep$mode().
    var suffix = 'sep$' + (mode || '');
    var sep = this[lang + suffix] || this['code' + suffix] || '';

    return r.join(sep);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.someIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if (callback( items[i] )) { return true; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return true; }
        }
    }

    return false;
};

yate.AST.items.allIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( !items[i][callback]() ) { return false; }
        }
    }

    return true;
};

yate.AST.items.noneIs = function(callback) {
    var items = this.Items;

    if (typeof callback === 'function') {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( callback( items[i] ) ) { return false; }
        }
    } else {
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i][callback]() ) { return false; }
        }
    }

    return true;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.isLocal = function() {
    return this.someIs('isLocal');
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items.getScope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};

