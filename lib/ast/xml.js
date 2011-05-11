Yate.AST.xml = {

    options: {
        base: 'expr'
    },

    _type: Yate.Types.XML

};

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

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.xmlFull = {

    options: {
        base: 'xml',
        mixin: 'items'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

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

// ----------------------------------------------------------------------------------------------------------------- //

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

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.xmlEnd = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('</' + this.Name + '>');
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.xmlAttrs = {

    options: {
        mixin: 'items'
    }

};

Yate.AST.xmlAttr = {

    toResult: function(result) {
        result.push(' ' + this.Name + '="');
        this.Value.toResult(result);
        result.push('"');
    },

    prepare: function() {
        this.trigger('set', 'mode', 'attr');
    },

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.xmlText = {

    options: {
        base: 'xml'
    },

    prepare: function() {
        this.trigger('set', 'mode', 'text');
        this.Text.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.Text.toResult(result);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.closeAttrs = {

    _type: Yate.Types.XML

};

Yate.AST.openAttrs = {

    _init: function(item) {
        this.Attrs = item.Attrs;
        item.Attrs = [];
    },

    _type: Yate.Types.XML

};

