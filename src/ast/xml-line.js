Yate.AST.xml_line = {

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
        var lastTag = this.lastTag();
        if (lastTag && lastTag.is('xml_start')) {
            lastTag.open = true;
            return true;
        }
        return false;
    },

    lastTag: function() {
        var last = this.last();
        if (last.is('xml_start')) {
            return last;
        }
    }

};

