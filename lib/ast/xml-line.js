Yate.AST.xmlLine = {

    options: {
        base: 'xml',
        mixin: 'items'
    },

    wellFormed: function(opened) {
        var that = this;

        this.iterate(function(item) {
            if (item.is('xmlStart')) {
                opened.push(item.Name);
            } else if (item.is('xmlEnd')) {
                var name = opened.pop();
                if (!name) {
                    that.error('Закрывающий тег </' + item.Name + '> не был предварительно открыт');
                } else if (item.Name !== name) {
                    that.error('Невалидный XML. Ожидается </' + name + '>');
                }
            }
        });
    }

};

