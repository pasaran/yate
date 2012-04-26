var common = {};

//  ---------------------------------------------------------------------------------------------------------------  //

common.inherit = function(class_, base, mixins) {
    var F = function() {};
    F.prototype = base.prototype;
    var proto = class_.prototype = new F();
    class_.prototype.constructor = class_;

    if (mixins) {
        for (var i = 0, l = mixins.length; i < l; i++) {
            common.extend( proto, mixins[i] );
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

common.extend = function(dest, src) {
    for (var key in src) {
        dest[key] = src[key];
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

common.makeArray = function(o) {
    return (o instanceof Array) ? o : [ o ];
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Использовать эти две функции из runtime.
common.quoteText = function(s) {
    if (s == null) { return ''; }
    s = s.toString(s);
    s = s.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
};

common.quoteAttr = function(s) {
    if (s == null) { return ''; }
    s = s.toString(s);
    s = s.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
};

//  FIXME: Использовать JSON.stringify().
common.quote = function(s) {
    s = s.replace("'", "\\'");
    return "'" + s + "'";
}

//  ---------------------------------------------------------------------------------------------------------------  //

common.nop = function() {};

common.true = function() { return true; };
common.false = function() { return false; };

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = common;

//  ---------------------------------------------------------------------------------------------------------------  //

