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
                opened.push(item.$name);
            } else if (item.is('xmlEnd')) {
                var name = opened.pop();
                if (!name) {
                    that.error('Закрывающий тег </' + item.$name + '> не был предварительно открыт');
                } else if (item.$name !== name) {
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
        result.push('<' + this.$name);
        this.$attrs.toResult(result);
        result.push('/>');
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.xmlStart = {

    options: {
        base: 'xml'
    },

    toResult: function(result) {
        result.push('<' + this.$name);
        if (!this.open) {
            this.$attrs.toResult(result);
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
        result.push('</' + this.$name + '>');
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
        result.push(' ' + this.$name + '="');
        this.$value.toResult(result);
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
        this.$text.cast(Yate.Types.SCALAR);
    },

    toResult: function(result) {
        this.$text.toResult(result);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.closeAttrs = {

    _type: Yate.Types.XML

};

Yate.AST.openAttrs = {

    _init: function(item) {
        this.$attrs = item.$attrs;
        item.$attrs = [];
    },

    _type: Yate.Types.XML

};

