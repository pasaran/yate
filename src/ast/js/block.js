yate.AST.block.js$predicates = function() {
    var predicates = this.scope.predicates;
    var r = [];
    for (var i = 0, l = predicates.length; i < l; i++) {
        var predicate = predicates[i];
        if (predicate.isLocal()) {
            r.push( predicates[i].js('var') );
        }
    }
    return r.join('\n\n');
};

yate.AST.block.js$jpaths = function() {
    var jpaths = this.scope.jpaths;
    var r = [];
    for (var i = 0, l = jpaths.length; i < l; i++) {
        r.push( jpaths[i].js('var') );
    }
    return r.join('\n');
};

yate.AST.block.js$matcher = function() {
    var matcher = {};
    this.Templates.iterate(function(template) {
        addToMatcher(template);
    });

    // FIXME: Как-то засунуть это в шаблоны.
    var r1 = [];
    for (var k1 in matcher) {
        var r2 = [];
        var v1 = matcher[k1];
        for (var k2 in v1) {
            r2.push('        "' + k2 + '": [ ' + v1[k2].join(', ') + ' ]');
        }
        r1.push('    "' + k1 + '": {\n' + r2.join(',\n') + '\n    }');
    }

    return (r1.length) ? 'var matcher = {\n' + r1.join(',\n') + '\n};' : '';

    // local functions.

    function addToMatcher(template) {
        var mode = template.Mode.Value;
        var modeTemplates = matcher[mode];
        if (!modeTemplates) {
            modeTemplates = matcher[mode] = {};
        }

        var selector = template.Selector;
        var step;
        if (selector.is('root')) {
            step = '';
        } else {
            step = selector.lastName();
        }

        var stepTemplates = modeTemplates[step];
        if (!stepTemplates) {
            stepTemplates = modeTemplates[step] = [];
        }
        stepTemplates.unshift('t' + template.Tid);
        if (step == '*') {
            for (var t in modeTemplates) {
                if (t != '*') {
                    modeTemplates[t].unshift('t' + template.Tid);
                }
            }
        }
    }

};

