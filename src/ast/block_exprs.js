yate.AST.block_exprs = {};

yate.AST.block_exprs.options = {
    mixin: 'items'
};

yate.AST.block_exprs._getType = function() {
    /*
    if (this.AsList) {
        return yate.types.LIST;
    }
    */
    return yate.AST.items._getType.call(this);
};

yate.AST.block_exprs.oncast = function(to) {
    if (to == 'list') {
        this.iterate(function(item) {
            item.cast(null);
        });
    } else {
        this.iterate(function(item) {
            item.cast(to);
        });
    }
};

yate.AST.block_exprs.action = function() {
    /*
    if (this.AsList) {
        this.iterate(function(item) {
            item.AsListItem = true;
        });
    }
    */
};

yate.AST.block_exprs.validate = function() {
    var opened = [];
    this.iterate(function(item) {
        if (item.is('xml_line') || item.is('block_list')) {
            item.wellFormed(opened);
        }
    });
    if (opened.length > 0) {
        this.error('Невалидный XML в блоке. Ожидается </' + opened[0] + '>');
    }
};

yate.AST.block_exprs.prepare = function() {
    if (this.type() != yate.types.XML) { return; }

    var o = [];
    var last;

    var that = this;

    var items = this.Items;
    var opened = false;

    for (var i = 0, l = items.length; i < l - 1; i++) {
        var item = items[i];
        var next = items[i + 1];

        o.push(item);

        if (item.opens() && !next.closes()) {
            item.lastTag().open = true;
            o.push( this.make( 'attrs_open', item.lastTag() ) );
            opened = true;
        }

        if (opened && next.closes()) {
            o.push( this.make('attrs_close', this) );
            opened = false;
        }

    }
    o.push( this.last() );

    this.Items = o;
};

/*
yate.AST.block_exprs.optimize = function() {
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
};
*/

