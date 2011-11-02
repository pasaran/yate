yate.AST.xml_empty = {};

yate.AST.xml_empty.options = {
    base: 'xml'
};

yate.AST.xml_empty.toResult = function(result) {
    result.push('<' + this.Name);
    this.Attrs.toResult(result);
    result.push('/>');
};

