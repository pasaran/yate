yate.AST.xml_text = {

    options: {
        base: 'xml'
    },

    prepare: function() {
        this.trigger('set', 'mode', 'text');
        this.Text.cast(yate.types.SCALAR);
    },

    toResult: function(result) {
        this.Text.toResult(result);
    }

};

