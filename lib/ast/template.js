Yate.AST.template = {

    options: {
        locals: {
            scope: true
        }
    },

    action: function() {
        this.$tid = this.state.tid++;
    },

    prepare: function() {
        this.$body.cast(Yate.Types.XML);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.templateMode = {};

// ----------------------------------------------------------------------------------------------------------------- //

