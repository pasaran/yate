var asts = require('./asts.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

asts.items = {};

asts.items._init = function(items) {
    this.Items = items || [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.add = function(item) {
    this.Items.push(item);
};

asts.items.length = function() {
    return this.Items.length;
};

asts.items.first = function() {
    return this.Items[0];
};

asts.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

asts.items.empty = function() {
    return (this.Items.length === 0);
};

asts.items.iterate = function(callback) {
    this.Items.forEach(callback);
};

asts.items.iterateBack = function(callback) {
    this.Items.reverse().forEach(callback);
};

asts.items.grep = function(callback) {
    return this.Items.filter(callback);
};

asts.items.map = function(callback) {
    return this.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.code = function(lang, mode) {
    mode = mode || '';

    var result = this._code(lang, mode);
    if (result !== undefined) {
        return result;
    }

    var r = [];
    this.iterate(function(item) {
        r.push( item.code(lang, mode) );
    });

    var sep = this[lang + 'sep__' + mode] || '';

    return r.join(sep);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id + ' [\n' + r + '\n]';
    }
    return '';
};

/*
asts.items.toJSON = function() {
    return this.map(function(item) {
        return item.toJSON();
    });
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
asts.items.someIs = function(callback) {
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

asts.items.allIs = function(callback) {
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

asts.items.noneIs = function(callback) {
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

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.apply = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], params);
    }
};

asts.items.walkdo = function(callback, params, pKey, pObject) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

asts.items.dowalk = function(callback, params) {
    callback(this, params);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

asts.items.mergeWith = function(ast) {
    this.Items = ast.p.Items.concat(this.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items._getType = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var currentId = items[0].id;
    var currentType = items[0].getType();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var nextType = item.getType();

        var commonType = yate.types.joinType(currentType, nextType);
        if (commonType == 'none') {
            item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
        }
        currentId = item.id;
        currentType = commonType;
    }

    return currentType;
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.isLocal = function() {
    return this.someIs('isLocal');
};

asts.items.isConst = function() {
    return this.allIs('isConst');
};

//  ---------------------------------------------------------------------------------------------------------------  //

asts.items.getScope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};

