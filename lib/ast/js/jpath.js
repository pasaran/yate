Yate.AST.jpath.compile = function() {

    var names = [];
    var predicates = [];

    var data;
    var steps = this.Steps;
    if (steps) {
        data = steps.compile();
    } else {
        data = {
            Steps: '[  ]',
            Predicates: '[  ]'
        };
    }
    data.Absolute = (this.Absolute) ? 1 : 0;

    data.Jid = this.Jid;
    data.Key = this.Key;

    return this._js('jpaths_item', data);
};

Yate.AST.jpathSteps.compile = function() {
    var steps = this.Items;

    var names = [];
    var predicates = [];

    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        names.push(step.Name);
        var predicate = step.Predicate;
        predicates.push(predicate ? 'p' + predicate.Pid : 0);
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

    data.Steps = "[ '" + names.join("', '") + "' ]";
    data.Predicates = "[ " + predicates.join(', ') + " ]";

    return data;
};

