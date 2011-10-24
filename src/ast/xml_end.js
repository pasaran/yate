yate.AST.xml_end = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('</' + this.Name + '>');
    }

};

