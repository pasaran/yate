yate.AST.xml_text = {};

yate.AST.xml_text.options = {
    base: 'xml'
};

yate.AST.xml_text.prepare = function() {
    this.walkBefore(function(ast) {
        ast.mode = 'text';
    });
    this.Text.cast('scalar');
};

yate.AST.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};

