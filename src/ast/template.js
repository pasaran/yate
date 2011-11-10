yate.AST.template = {};

yate.AST.template.action = function() {
    this.Tid = this.state.tid++;
};

yate.AST.template.prepare = function() {
    var body = this.Body;
    var block = body.Block;

    /*
    if (body.AsList) {
        block.cast();
    } else {
    }
    */

    block.cast();
};

yate.AST.template._getType = function() {
    var type = this.type();
    if (type == yate.Types.ARRAY || type == yate.types.OBJECT) {
        return type;
    }
    return yate.types.XML;
};

