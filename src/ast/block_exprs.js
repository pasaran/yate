Yate.AST.block_exprs = {

    options: {
        mixin: 'items'
    },

    _getType: function() {
        if (this.AsList) {
            return Yate.Types.LIST;
        }
        return Yate.AST.items._getType.call(this);
    },

    oncast: function(to) {
        if (to == 'list') {
            this.iterate(function(item) {
                item.cast(null);
            });
        } else {
            this.iterate(function(item) {
                item.cast(to);
            });
        }
    },

    action: function() {
        if (this.AsList) {
            this.iterate(function(item) {
                item.AsListItem = true;
            });
        }
    },

    validate: function() {
        var opened = [];
        this.iterate(function(item) {
            if (item.is('xml_line') || item.is('block_list')) {
                item.wellFormed(opened);
            }
        });
        if (opened.length > 0) {
            this.error('Невалидный XML в блоке. Ожидается </' + opened[0] + '>');
        }
    },

    /*
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
    */

    prepare: function() {
        if (this.type() != Yate.Types.XML) { return; }

        var o = [];
        var last;

        var that = this;

        var items = this.Items;
        for (var i = 0, l = items.length; i < l - 1; i++) {
            var item = items[i];
            var next = items[i + 1];

            var isOpen = item.isOpen();

            o.push(item);

            if (isOpen && next.isOpen() === undefined) {
                item.lastTag().open = true;
                o.push( this.make( 'attrs_open', item.lastTag() ) );
            }

            if (isOpen === undefined && !next.isOpen()) {
                o.push( this.make('attrs_close') );
            }

        }
        o.push( this.last() );

        /*
        this.iterate(function(item) {
            var open = item.isOpen();
            console.log( item.id, open, last );
            if (open || last !== false && open === false) {
            // if (last === undefined && open !== undefined) {
                // o.push(that.make('attrs_close'));
            }
            o.push(item);
            if (open) {
                // o.push(that.make('attrs_open', item.lastTag()));
            }
            last = open;
        });
        */

        this.Items = o;

        /*
        this.iterate(function(item) {
            console.log('items', item.id, item.isOpen(), item.type());
        });
        */
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

/*
Yate.AST.blockList = {

    options: {
        mixin: 'items'
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
*/

