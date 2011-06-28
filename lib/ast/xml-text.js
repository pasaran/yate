Yate.AST.xmlText = {

    options: {
        base: 'xml'
    },

    prepare: function() {
        this.trigger('set', 'mode', 'text');
        this.Text.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Text.toResult(result);
    }

};

