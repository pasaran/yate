yate.AST.block.codedata$ = function() {

    var data = {};

    // Сериализуем список всех предикатов.

    var predicates = this.scope.predicates;
    var r = [];
    for (var i = 0, l = predicates.length; i < l; i++) {
        r.push( predicates[i].code() );
    }
    data.Predicates = r.join('\n\n');

    // Сериализуем список всех jpath'ов. В дальнейшем во всех местах вместо собственно jpath'а используется его id в этом массиве.

    var jpaths = this.scope.jpaths;
    var r = [];
    for (var i = 0, l = jpaths.length; i < l; i++) {
        r.push( jpaths[i].code('jpath_var') );
    }
    data.JPaths = r.join('\n');

    // Сериализуем список всех шаблонов, функций и переменных.

    data.Templates = this.Templates.code();
    data.Defs = this.Defs.code();

    // Сериализуем двухуровневый каталог шаблонов. Первый уровень -- по моде, второй по последнему nametest'у.

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
    if (r1.length) {
        data.Matcher = '{\n' + r1.join(',\n') + '\n}';
    }

    // Заполняем шаблон данными.

    return data;

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

