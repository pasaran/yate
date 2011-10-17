Yate.AST.xmlEnd = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('</' + this.Name + '>');
    }

};

