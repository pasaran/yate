yate.AST.template = {};

yate.AST.template.action = function() {
    this.Tid = this.state.tid++;
};

yate.AST.template.setTypes = function() {
    this.Body.cast( this.type() );
};

yate.AST.template._getType = function() {
    var type = this.Body.type();
    if (type == 'array' || type == 'object') {
        return type;
    }
    return 'xml';
};

