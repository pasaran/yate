yate.AST.jpath.compile = function() {
    var steps = this.Steps.Items;
    var actions = [];
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        if ( step.is('jpath_dots') ) {
            actions.push( 1, step.Dots.length - 1 );
        } else {
            actions.push( 0, JSON.stringify(step.Name) );
            var predicates = step.Predicates;
            if (predicates) {
                predicates = predicates.Items;
                for (var j = 0, m = predicates.length; j < m; j++) {
                    var predicate = predicates[j];
                    if (predicate.isLocal()) {
                        actions.push( 2, 'p' + predicate.Pid );
                    } else {
                        actions.push( 3, predicate.Expr.js() );
                    }
                }
            }
        }
    }

    return '[ ' + actions.join(', ') + ' ]'; // FIXME: Унести в шаблоны.
};

