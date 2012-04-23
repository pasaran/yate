var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.template = {};

AST.template.action = function() {
    this.Tid = this.state.tid++;
};

AST.template.setTypes = function() {
    this.Body.cast( this.type() );
};

AST.template._getType = function() {
    var type = this.Body.type();
    if (type == 'array' || type == 'object') {
        return type;
    }
    return 'xml';
};

