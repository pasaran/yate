yate.AST.xml_attr = {};

yate.AST.xml_attr.toResult = function(result) {
    result.push(' ' + this.Name + '="');
    this.Value.toResult(result);
    result.push('"');
};

yate.AST.xml_attr.setTypes = function() {
    this.Value.cast('attrvalue');
};

