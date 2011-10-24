// ----------------------------------------------------------------------------------------------------------------- //
// AST.items
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.items = {

    _init: function(items) {
        this.Items = yate.Common.makeArray(items || []);
    },

    _getType: function() {
        var items = this.Items;
        var l = items.length;

        if (!l) { return yate.Types.SCALAR; } // FIXME: А нужно ли это? Может быть UNDEF сработает?

        var currentId = items[0].id;
        var currentType = items[0].type();

        for (var i = 1; i < l; i++) {
            var item = items[i];
            var nextType = item.type();

            var commonType = yate.Types.joinType(currentType, nextType);
            if (commonType == yate.Types.NONE) {
                item.error('Несовместимые типы ' + currentType + ' (' + currentId + ') и ' + nextType + ' (' + item.id + ')');
            }
            currentId = item.id;
            currentType = commonType;
        };

        return currentType;
    },

    add: function(item) {
        this.Items.push(item);
    },

    last: function() {
        var items = this.Items;
        return items[items.length - 1];
    },

    empty: function() {
        return (this.Items.length == 0);
    },

    iterate: function(callback) {
        var items = this.Items;
        for (var i = 0, l = items.length; i < l; i++) {
            callback(items[i], i);
        }
    },

    grep: function(callback) {
        var items = this.Items;
        var r = [];
        for (var i = 0, l = items.length; i < l; i++) {
            var item = items[i];
            if (callback(item, i)) {
                r.push(item);
            }
        }
        return r;
    },

    map: function(callback) {
        return yate.Common.map(this.Items, callback);
    },

    yate: function() {
        var options = this.options.yate || {};
        return this.map('yate').join(options.separator || '');
    },

    js: function(id, data, mode) {
        mode = mode || ((typeof id == 'object') ? id.mode : '') || '';

        var options = this.options.js || {};
        var r = [];
        this.iterate(function(item) {
            r.push(item.js(id, data, mode));
        });
        return r.join( ((mode) ? options['separator$' + mode] : options.separator) || '');
    },

    toResult: function(result) {
        this.iterate(function(item) {
            item.toResult(result);
        });
    },

    toString: function() {
        if (this.Items.length > 0) {
            var r = this.Items.join('\n').replace(/^/gm, '    ');
            return this.id.bold + ' [\n' + r + '\n]';
        }
        return '';
    },

    oncast: function(to) {
        this.iterate(function(item) {
            item.cast(to);
        });
    },

    isLocal: function() {
        var items = this.Items;
        for (var i = 0, l = items.length; i < l; i++) {
            if ( items[i].isLocal() ) {
                return true;
            }
        }
        return false;
    }

};

