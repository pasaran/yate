yate.AST.xml_end = {};

yate.AST.xml_end.options = {
    base: 'xml'
};

yate.AST.xml_end.toResult = function(result) {
    result.push('</' + this.Name + '>');
};

