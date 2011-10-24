yate.AST.xml_line = {

    options: {
        base: 'xml',
        mixin: 'items'
    },

    wellFormed: function(opened) {
        var that = this;

        this.iterate(function(item) {
            if (item.is('xml_start')) {
                opened.push(item.Name);
            } else if (item.is('xml_end')) {
                var name = opened.pop();
                if (!name) {
                    that.error('Закрывающий тег </' + item.Name + '> не был предварительно открыт');
                } else if (item.Name !== name) {
                    that.error('Невалидный XML. Ожидается </' + name + '>');
                }
            }
        });
    },

    isOpen: function() {
        return !!this.lastTag();
    },

    lastTag: function() {
        var last = this.last();
        if (last.is('xml_start')) {
            return last;
        }
    }

};

