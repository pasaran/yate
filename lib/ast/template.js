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
        this.Body.cast(Yate.Types.XML);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.templateMode = {};

// ----------------------------------------------------------------------------------------------------------------- //

