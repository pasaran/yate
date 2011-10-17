Yate.AST.jpath_steps.compile = function() {
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

