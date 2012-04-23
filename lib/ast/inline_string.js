var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_string = {};

AST.inline_string.options = {
    base: 'inline_expr'
};

AST.inline_string._type = 'scalar';

AST.inline_string.oncast = function(to) {
    this.Value.cast(to);

    return false;
};

AST.inline_string.toResult = function(result) {
    this.Value.toResult(result);
};

AST.inline_string.asString = function() {
    var s = '';

    var items = this.Value.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        s += item.asString();
    }

    return s;
};

