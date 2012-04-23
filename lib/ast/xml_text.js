var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.xml_text = {};

AST.xml_text.options = {
    base: 'xml'
};

AST.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

AST.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};

