var yate = require('./yate.js');

var no = require('nommon');

var AST = require('./ast.js');

var AST.Items = function() {};

no.inherit(AST.Items, AST);

AST.Items.prototype.foo = '';

//  ---------------------------------------------------------------------------------------------------------------  //
//  items
//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items = {};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items._init = function(items) {
    this.p.Items = items || [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.add = function(item) {
    this.p.Items.push(item);
};

yate.asts.items.length = function() {
    return this.p.Items.length;
};

yate.asts.items.first = function() {
    return this.p.Items[0];
};

yate.asts.items.last = function() {
    var items = this.p.Items;
    return items[items.length - 1];
};

yate.asts.items.empty = function() {
    return (this.p.Items.length === 0);
};

yate.asts.items.iterate = function(callback) {
    this.p.Items.forEach(callback);
};

yate.asts.items.iterateBack = function(callback) {
    this.p.Items.reverse().forEach(callback);
};

yate.asts.items.grep = function(callback) {
    return this.p.Items.filter(callback);
};

yate.asts.items.map = function(callback) {
    return this.p.Items.map(callback);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.code = function(lang, mode) {
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

yate.asts.items.toString = function() {
    if (this.p.Items.length > 0) {
        var r = this.p.Items.join('\n').replace(/^/gm, '    ');
        return this.id.bold + ' [\n' + r + '\n]';
    }
    return '';
};

/*
yate.asts.items.toJSON = function() {
    return this.map(function(item) {
        return item.toJSON();
    });
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Из этих трех методов используется только один в одном месте!
yate.asts.items.someIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.allIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.noneIs = function(callback) {
    var items = this.p.Items;

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

yate.asts.items.apply = function(callback, params) {
    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        callback(items[i], params);
    }
};

yate.asts.items.walkdo = function(callback, params, pKey, pObject) {
    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].walkdo(callback, params, i, items);
    }

    callback(this, params, pKey, pObject);
};

yate.asts.items.dowalk = function(callback, params) {
    callback(this, params);

    var items = this.p.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        items[i].dowalk(callback, params, i, items);
    }
};

yate.asts.items.mergeWith = function(ast) {
    this.p.Items = ast.p.Items.concat(this.p.Items);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items._getType = function() {
    var items = this.p.Items;
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

yate.asts.items.toResult = function(result) {
    this.iterate(function(item) {
        item.toResult(result);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.oncast = function(to) {
    this.iterate(function(item) {
        item.cast(to);
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.isLocal = function() {
    return this.someIs('isLocal');
};

yate.asts.items.isConst = function() {
    return this.allIs('isConst');
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.asts.items.getScope = function() {
    var items = this.p.Items;
    var l = items.length;
    if (!l) { return this.scope; }

    var scope = items[0].getScope();
    for (var i = 1; i < l; i++) {
        scope = yate.Scope.commonScope( scope, items[i].getScope() );
    }

    return scope;
};


