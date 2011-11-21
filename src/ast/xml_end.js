yate.AST.xml_end = {};

yate.AST.xml_end.options = {
    base: 'xml'
};

yate.AST.xml_end.action = function() {
    if (yate.shortTags[ this.Name ]) {
        this.Short = true;
    }
};

yate.AST.xml_end.toResult = function(result) {
    if (!this.Short) {
        result.push('</' + this.Name + '>');
    }
};

