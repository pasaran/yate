yate.AST.xml_start = {};

yate.AST.xml_start.options = {
    base: 'xml'
};

yate.AST.xml_start.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push( (yate.shortTags[name]) ? '/>' : '>' );
    }
};

