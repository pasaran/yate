yate.AST.xml_text = {};

yate.AST.xml_text.options = {
    base: 'xml'
};

yate.AST.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

yate.AST.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};

