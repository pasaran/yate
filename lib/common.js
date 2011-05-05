
var Yate = {};

// ----------------------------------------------------------------------------------------------------------------- //

// COMMON

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Common = {};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Common.inherits = function(class_, base, mixin) {
    var F = function() {};
    F.prototype = base.prototype;
    class_.prototype = new F();
    class_.prototype.constructor = class_;

    if (mixin) {
        Yate.Common.mixin(class_, mixin);
    }
};

Yate.Common.mixin = function(class_, mixin) {
    mixin = Yate.Common.makeArray(mixin);
    for (var i = 0, l = mixin.length; i < l; i++) {
        Yate.Common._mixinOne(class_, mixin[i]);
    }
};

Yate.Common._mixinOne = function(class_, mixin) {
    var proto = class_.prototype;
    for (var name in mixin) {
        proto[name] = mixin[name];
    }
};

Yate.Common.makeArray = function(o) {
    return (o instanceof Array) ? o : [ o ];
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Common.keys = function(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
};

Yate.Common.$keys = function(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && /^\$/.test(key)) {
            keys.push(key);
        }
    }
    return keys;
};

Yate.Common.arr2obj = function(arr) {
    var obj = {};
    for (var i = 0, l = arr.length; i < l; i++) {
        obj[arr[i]] = 1;
    }
    return obj;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Common.quoteText = function(s) {
    if (!s) { return ''; }
    s = s.toString(s);
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
};

Yate.Common.quoteAttr = function(s) {
    if (!s) { return ''; }
    s = s.toString(s);
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
};

Yate.Common.quote = function(s) {
    s = s.replace("'", "\\'");
    return "'" + s + "'";
}

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Common.map = function(a, m) {
    var r = [];
    if (typeof m == 'function') {
        for (var i = 0, l = a.length; i < l; i++) {
            r.push( m( a[i] ) );
        }
    } else {
        for (var i = 0, l = a.length; i < l; i++) {
            r.push( a[i][m]() );
        }
    }
    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

function log(o) {
    console.log( require('util').inspect(o, true, null) );
}
