Yate.AST.xmlEmpty = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('<' + this.Name);
        this.Attrs.toResult(result);
        result.push('/>');
    }

};

