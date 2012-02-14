yate.AST.xml_empty = {};

yate.AST.xml_empty.options = {
    base: 'xml'
};

yate.AST.xml_empty.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    this.Attrs.toResult(result);
    if ( yate.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};

