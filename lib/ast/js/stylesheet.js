Yate.AST.stylesheet.js = function() {

    var data = {};

    // Сериализуем список всех предикатов.

    var predicates = this.state.predicates;
    var r = [];
    for (var i = 0, l = predicates.length; i < l; i++) {
        r.push(predicates[i].js());
    }
    data.Predicates = r.join('\n\n');

    // Сериализуем список всех jpath'ов. В дальнейшем во всех местах вместо собственно jpath'а используется его id в этом массиве.

    var jpaths = this.state.jpaths;
    var r = [];
    for (var i = 0, l = jpaths.length; i < l; i++) {
        r.push(jpaths[i].compile());
    }
    data.Jpaths = r.join('\n\n');

    // Сериализуем список всех шаблонов, функций и переменных.

    var body = this.Body;

    data.Templates = body.Templates.js();
    data.Defs = body.Defs.js();

    // Сериализуем двухуровневый каталог шаблонов. Первый уровень -- по моде, второй по последнему nametest'у.

    var matcher = {};
    body.Templates.iterate(function(template) {
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
    data.Matcher = '{\n' + r1.join(',\n') + '\n}';

    // Заполняем шаблон данными.

    return this._js(data);

    // local functions.

    function addToMatcher(template) {
        var mode = template.Mode.Value;
        var modeTemplates = matcher[mode];
        if (!modeTemplates) {
            modeTemplates = matcher[mode] = {};
        }

        var step = template.Jpath.lastName();
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

