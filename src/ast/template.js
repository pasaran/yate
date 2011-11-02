yate.AST.template = {};

yate.AST.template.action = function() {
    this.Tid = this.state.tid++;
};

yate.AST.template.prepare = function() {
    var body = this.Body;
    var block = body.Block;

    if (body.AsList) {
        block.cast();
    } else {
        var type = block.type();
        if (type == yate.types.ARRAY || type == yate.types.OBJECT) {
            block.cast(type);
        } else {
            block.cast(yate.types.XML);
        }
    }
};

