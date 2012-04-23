var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.pair = {};

AST.pair._type = 'pair',

AST.pair.setTypes = function() {
    this.Key.cast('scalar');

    var type = this.Value.type();
    if (type == 'array' || type == 'object') {
        this.Value.cast(type);
    } else {
        this.Value.cast('xml'); // FIXME: А не scalar?
    }
};

