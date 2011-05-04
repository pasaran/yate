Yate.AST.jpath = {

    options: {
        base: 'inlineExpr'
    },

    _type: Yate.Types.NODESET,

    action: function() {
        var key = this.yate(); // Каноническая запись jpath.

        var state = this.state;

        // В state хранятся все уникальные jpath'ы.
        // Если где-то используется два (или больше) одинаковых jpath'а, то первый из них будет запомнен,
        // а все последующие будут ссылаться на него по его id-шнику.

        // Если этот jpath еще не хранится в state, то добаляем его туда.
        var jid = state.jkeys[key];
        if (jid === undefined) {
            jid = state.jkeys[key] = state.jid++;
            state.jpaths.push(this);
        }

        this.$jid = jid; // Запоминаем id-шник.
        this.$key = key;
    },

    validate: function() {
        var context = this.$context;
        if (context && !Yate.Types.convertable(context.type(), Yate.Types.NODESET)) {
            context.error('Invalid type. Should be NODESET');
        }
    },

    // Возвращаем значение последнего nametest'а или же ''.
    // Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
    lastName: function() {
        var steps = this.$steps;
        if (!steps) { return ''; }
        var l = steps.$items.length;
        return (l) ? steps.$items[l - 1].$name : '';
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.jpathSteps = {

    options: {
        mixin: 'items'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.jpathStep = {};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.predicate = {

    action: function() {
        var key = this.$expr.yate(); // Каноническая запись предиката.

        var state = this.state;

        // Если этот jpath еще не хранится в state, то добаляем его туда.
        var pid = state.pkeys[key];
        if (pid === undefined) {
            pid = state.pkeys[key] = state.pid++;
            state.predicates.push(this);
        }

        this.$pid = pid;
        this.$key = key;
    },

    prepare: function() {
        this.$expr = this.$expr.cast(Yate.Types.BOOLEAN);
    },

    validate: function() {
        if (!Yate.Types.convertable(this.$expr.type(), Yate.Types.BOOLEAN)) {
            this.$expr.error('Type must be BOOLEAN');
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

