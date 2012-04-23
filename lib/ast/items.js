var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  AST.items
//  ---------------------------------------------------------------------------------------------------------------  //

AST.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items._init = function(items) {
    this.Items = yate.makeArray(items || []);
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items._getType = function() {
    var items = this.Items;
    var l = items.length;

    if (!l) { return 'scalar'; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

    var currentId = items[0].id;
    var currentType = items[0].type();

    for (var i = 1; i < l; i++) {
        var item = items[i];
        var nextType = item.type();

        var commonType = yate.types.joinType(currentType, nextType);
        if (commonType == 'none') {
            item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
        }
        currentId = item.id;
        currentType = commonType;
    };

    return currentType;
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.add = function(item) {
    this.Items.push(item);
};

AST.items.last = function() {
    var items = this.Items;
    return items[items.length - 1];
};

AST.items.empty = function() {
    return (this.Items.length == 0);
};

AST.items.iterate = function(callback) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], i);
    }
};

AST.items.grep = function(callback) {
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

AST.items.map = function(callback) {
    return yate.map(this.Items, callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.code = function(lang, mode) {
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

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.toString = function() {
    if (this.Items.length > 0) {
        var r = this.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
AST.items.someIs = function(callback) {
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

AST.items.allIs = function(callback) {
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

AST.items.noneIs = function(callback) {
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

AST.items.isLocal = function() {
    return this.someIs('isLocal');
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.getScope = function() {
    var items = this.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};

//  ---------------------------------------------------------------------------------------------------------------  //

AST.items.applyChildren = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback( items[i], params );
    }
};

AST.items.walkAfter = function(callback, params) {
    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkAfter(callback, params, i, items);
    }

    callback(this, params);
};

AST.items.walkBefore = function(callback, params) {
    callback(this, params);

    var items = this.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkBefore(callback, params, i, items);
    }
};

