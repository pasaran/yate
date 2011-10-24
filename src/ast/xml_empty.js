yate.AST.xml_empty = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('<' + this.Name);
        this.Attrs.toResult(result);
        result.push('/>');
    }

};

