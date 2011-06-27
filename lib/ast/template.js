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

        if (body.AsList) {
            body.cast();
        } else {
            var type = body.type();
            if (type == Yate.Types.ARRAY || type == Yate.Types.OBJECT) {
                body.cast(type);
            } else {
                body.cast(Yate.Types.XML);
            }
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.templateMode = {};

// ----------------------------------------------------------------------------------------------------------------- //

