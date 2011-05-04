Yate.AST.jpath.compile = function() {

    var names = [];
    var predicates = [];

    var data;
    var steps = this.$steps;
    if (steps) {
        data = steps.compile();
    } else {
        data = {
            $steps: '[  ]',
            $predicates: '[  ]'
        };
    }
    data.$absolute = (this.$absolute) ? 1 : 0;

    data.$jid = this.$jid;
    data.$key = this.$key;

    return this._js('jpaths_item', data);
};

Yate.AST.jpathSteps.compile = function() {
    var steps = this.$items;

    var names = [];
    var predicates = [];

    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        names.push(step.$name);
        var predicate = step.$predicate;
        predicates.push(predicate ? 'p' + predicate.$pid : 0);
    }

    var l;
    while (l = predicates.length) {
        if (predicates[l - 1] === 0) {
            predicates.pop();
        } else {
            break;
        }
    }

    var data = {};

    data.$steps = "[ '" + names.join("', '") + "' ]";
    data.$predicates = "[ " + predicates.join(', ') + " ]";

    return data;
};

