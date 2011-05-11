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

        this.Jid = jid; // Запоминаем id-шник.
        this.Key = key;
    },

    validate: function() {
        var context = this.Context;
        if (context && !Yate.Types.convertable(context.type(), Yate.Types.NODESET)) {
            context.error('Invalid type. Should be NODESET');
        }
    },

    // Возвращаем значение последнего nametest'а или же ''.
    // Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
    lastName: function() {
        var steps = this.Steps;
        if (!steps) { return ''; }
        var l = steps.Items.length;
        return (l) ? steps.Items[l - 1].Name : '';
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
        var key = this.Expr.yate(); // Каноническая запись предиката.

        var state = this.state;

        // Если этот jpath еще не хранится в state, то добаляем его туда.
        var pid = state.pkeys[key];
        if (pid === undefined) {
            pid = state.pkeys[key] = state.pid++;
            state.predicates.push(this);
        }

        this.Pid = pid;
        this.Key = key;
    },

    prepare: function() {
        this.Expr = this.Expr.cast(Yate.Types.BOOLEAN);
    },

    validate: function() {
        if (!Yate.Types.convertable(this.Expr.type(), Yate.Types.BOOLEAN)) {
            this.Expr.error('Type must be BOOLEAN');
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

