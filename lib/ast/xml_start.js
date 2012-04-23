var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.xml_start = {};

AST.xml_start.options = {
    base: 'xml'
};

AST.xml_start.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push( (yate.shortTags[name]) ? '/>' : '>' );
    }
};

