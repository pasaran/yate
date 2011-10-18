Yate.AST.xml_attr = {

    toResult: function(result) {
        result.push(' ' + this.Name + '="');
        this.Value.toResult(result);
        result.push('"');
    },

    prepare: function() {
        this.trigger('set', 'mode', 'attr');
    },

};

