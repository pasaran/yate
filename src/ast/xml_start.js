yate.AST.xml_start = {};

yate.AST.xml_start.options = {
    base: 'xml'
};

yate.AST.xml_start.toResult = function(result) {
    result.push('<' + this.Name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push('>');
    }
};

