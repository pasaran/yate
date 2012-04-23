var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.xml_empty = {};

AST.xml_empty.options = {
    base: 'xml'
};

AST.xml_empty.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    this.Attrs.toResult(result);
    if ( yate.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};

