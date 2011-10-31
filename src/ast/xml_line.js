yate.AST.xml_line = {};

yate.AST.xml_line.options = {
    base: 'xml',
    mixin: 'items'
};

yate.AST.xml_line.wellFormed = function(opened) {
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
};

yate.AST.xml_line.opens = function() {
    return !!this.lastTag();
};

yate.AST.xml_line.lastTag = function() {
    var last = this.last();
    if (last.is('xml_start')) {
        return last;
    }
};

