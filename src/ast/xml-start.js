Yate.AST.xmlStart = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('<' + this.Name);
        if (!this.open) {
            this.Attrs.toResult(result);
            result.push('>');
        }
    }

};

