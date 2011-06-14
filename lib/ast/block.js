Yate.AST.block = {

    options: {
        locals: {
            scope: true
        },
        order: [ 'Defs', 'Templates', 'Exprs', 'Context' ]
    },

    _getType: function() {
        return this.Exprs.type();
    },

    _init: function(exprs) {
        this.Defs = Yate.AST.make('blockDefs');
        this.Templates = Yate.AST.make('blockTemplates');
        this.Exprs = Yate.AST.make('blockExprs', exprs);
    },

    oncast: function(from, to) {
        this.Exprs.cast(to);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.blockComplex = {

    options: {
        base: 'expr'
    },

    _getType: function() {
        return this.Body.type();
    },

    oncast: function(from, to) {
        this.Body.cast(to);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.blockDefs = {

    options: {
        mixin: 'items'
    }

};

Yate.AST.blockTemplates = {

    options: {
        mixin: 'items'
    }

};

Yate.AST.blockExprs = {

    options: {
        mixin: 'items'
    },

    validate: function() {
        var opened = [];
        this.iterate(function(item) {
            if (item.is('xmlLine') || item.is('blockList')) {
                item.wellFormed(opened);
            }
        });
        if (opened.length > 0) {
            this.error('Невалидный XML в блоке. Ожидается </' + opened[0] + '>');
        }
    },

    optimize: function() {
        var o = [];
        var r = [];

        var that = this;

        // Собираем несколько подряд идущих xmlLine/inlineList в один blockList.
        this.iterate(function(item) {
            if (item.is('xmlLine') || item.is('inlineList')) {
                r.push(item);
            } else {
                if (r.length) {
                    o.push(that.make('blockList', r));
                    r = [];
                }
                o.push(item);
            }
        });
        if (r.length) {
            o.push(that.make('blockList', r));
        }

        this.Items = o;
    },

    prepare: function() {
        if (this.type() != Yate.Types.XML) { return; }

        var o = [];
        var last;

        var that = this;

        this.iterate(function(item) {
            var open = item.isOpen();
            if (open || last !== false && open === false) {
            // if (last === undefined && open !== undefined) {
                o.push(that.make('closeAttrs'));
            }
            o.push(item);
            if (open) {
                o.push(that.make('openAttrs', item.lastTag()));
            }
            last = open;
        });

        this.Items = o;

        /*
        this.iterate(function(item) {
            console.log('items', item.id, item.isOpen(), item.type());
        });
        */
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.blockList = {

    options: {
        mixin: 'items'
    },

    isOpen: function() {
        var lastTag = this.lastTag();
        if (lastTag && lastTag.is('xmlStart')) {
            lastTag.open = true;
            return true;
        }
        return false;
    },

    lastTag: function() {
        var last = this.last();
        if (last.is('xmlLine')) {
            return last.last();
        }
    },

    wellFormed: function(opened) {
        var that = this;
        this.iterate(function(item) {
            if (item.is('xmlLine')) {
                item.wellFormed(opened);
            }
        });
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.pair = {

    _type: Yate.Types.PAIR

};

Yate.AST.list = {

    options: {
        mixin: 'items'
    }

};

