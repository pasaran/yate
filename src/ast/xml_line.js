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
            } else if ( (item.Name !== name) && (item.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            item.Name = name; // FIXME: Не очень подходящее место для этого действия.
                              //        Лучше бы унести это в какой-то .action().
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

