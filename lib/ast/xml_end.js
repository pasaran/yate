var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.xml_end = {};

AST.xml_end.options = {
    base: 'xml'
};

AST.xml_end.action = function() {
    if (yate.shortTags[ this.Name ]) {
        this.Short = true;
    }
};

AST.xml_end.toResult = function(result) {
    if (!this.Short) {
        result.push('</' + this.Name + '>');
    }
};

