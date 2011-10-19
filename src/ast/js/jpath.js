Yate.AST.jpath.compile = function() {
    var data = {
        Jid: this.Jid,
        Key: this.Key
    }

    var steps = this.Steps.Items;
    var actions = [];
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        if ( step.is('jpath_dots') ) {
            actions.push( 1, step.Dots.length );
        } else {
            actions.push( 0, JSON.stringify(step.Name) );
            var predicates = step.Predicates;
            if (predicates) {
                predicates = predicates.Items;
                for (var j = 0, m = predicates.length; j < m; j++) {
                    var predicate = predicates[j];
                    actions.push( predicate.isLocal() ? 2 : 3 );
                    actions.push( 'p' + predicate.Pid );
                }
            }
        }
    }
    data.Actions = actions.join(', ');

    return this._js('jpaths_item', data);
};

