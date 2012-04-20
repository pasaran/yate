// ----------------------------------------------------------------------------------------------------------------- //

yate.inherits = function(class_, base, mixin) {
    var F = function() {};
    F.prototype = base.prototype;
    class_.prototype = new F();
    class_.prototype.constructor = class_;

    if (mixin) {
        yate.mixin(class_, mixin);
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.mixin = function(class_, mixin) {
    mixin = yate.makeArray(mixin);
    for (var i = 0, l = mixin.length; i < l; i++) {
        yate._mixinOne(class_, mixin[i]);
    }
};

yate._mixinOne = function(class_, mixin) {
    var proto = class_.prototype;
    for (var name in mixin) {
        proto[name] = mixin[name];
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.makeArray = function(o) {
    return (o instanceof Array) ? o : [ o ];
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.quoteText = function(s) {
    if (!s) { return ''; }
    s = s.toString(s);
    s = s.replace(/&(?![A-Za-z]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
};

yate.quoteAttr = function(s) {
    if (!s) { return ''; }
    s = s.toString(s);
    s = s.replace(/&(?![A-Za-z]\w+;)/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
};

yate.quote = function(s) {
    s = s.replace("'", "\\'");
    return "'" + s + "'";
}

// ----------------------------------------------------------------------------------------------------------------- //

yate.map = function(a, m) {
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

yate.nop = function() {};

yate.true = function() { return true; };
yate.false = function() { return false; };

// ----------------------------------------------------------------------------------------------------------------- //

function log(o) {
    console.error( require('util').inspect(o, true, null) );
}
