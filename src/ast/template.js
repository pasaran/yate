Yate.AST.template = {

    options: {
        locals: {
            scope: true
        }
    },

    action: function() {
        this.Tid = this.state.tid++;
    },

    prepare: function() {
        var body = this.Body;
        var block = body.Block;

        if (body.AsList) {
            block.cast();
        } else {
            var type = block.type();
            if (type == Yate.Types.ARRAY || type == Yate.Types.OBJECT) {
                block.cast(type);
            } else {
                block.cast(Yate.Types.XML);
            }
        }
    }

};

