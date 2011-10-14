// ----------------------------------------------------------------------------------------------------------------- //
// CodeTemplates
// ----------------------------------------------------------------------------------------------------------------- //

var CodeTemplates = {
    _templates: {}
};

// ----------------------------------------------------------------------------------------------------------------- //

var Fs = require('fs');

// ----------------------------------------------------------------------------------------------------------------- //

CodeTemplates.add = function(lang, id, value) {
    var templates = this._templates[lang];
    if (!templates) {
        templates = this._templates[lang] = {};
    }

    var items = templates[id];
    if (!items) {
        items = templates[id] = [];
    }

    items.push(value);
};

CodeTemplates.get = function(lang, id) {
    var templates = this._templates[lang];
    if (!templates) {
        templates = this.read(lang);
    }

    return templates[id] || [];
};

// ----------------------------------------------------------------------------------------------------------------- //

CodeTemplates.read = function(lang, filename) {

    filename = filename || __dirname + '/../templates/' + lang + '.tmpl';

    var content = Fs.readFileSync(filename, 'utf-8');

    // Удаляем комментарии.
    content = content.replace(/^#.*\n/gm, '');

    // Разбиваем на отдельные шаблоны.
    var parts = content.match(/^\S.*\n(\n|    .*\n)+/gm);

    var r;
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];

        // Каждый шаблон устроен следующим образом:
        // description
        //     body
        //
        // description -- это одна строка, состоящая из имени, моды, предиката и дефолтных значений. Например:
        // item :content [ %Count > 0 ] ( %Title = 'Hello', %Value = '42' )
        // При этом только имя обязательно
        //
        // body -- это текст, состоящий либо из пустых строк, либо из строк, отбитых четырьмя пробелами.

        r = /^([\w-]+|\*)\ *(:[\w-]+)?\ *(\[.*\])?\ *(\(.*\))?\n([\S\s]*)$/.exec(part);

        if (!r) {
            throw new Error("Ошибка синтаксиса в CodeTemplates:\n" + part);
        }

        // id = name | name:mode
        var id = r[1] + (r[2] || '');

        var predicate = r[3];
        if (predicate) {
            predicate = predicate.slice(1, -1);
        }

        // Преобразовываем строку вида " %Title = 'Hello', %Value = '42' " в объект.
        var defaults = {};
        if (r[4]) {
            var list = r[4].split(/%([\w-]+)\s*=\s*'(.*?)'/g);
            for (var j = 1, k = list.length; j < k; j += 3) {
                defaults[ list[j] ] = list[j + 1];
            }
        }

        // Убираем лишние отступы и переводы строк.
        var body = r[5]
            .replace(/^    /gm, '')
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');

        this.add(lang, id, {
            name: r[1],
            mode: r[2],
            predicate: predicate,
            defaults: defaults,
            body: body
        });
    }

    return this._templates[lang];

};

// ----------------------------------------------------------------------------------------------------------------- //

CodeTemplates.fill = function(lang, name, mode, data, method) {
    mode = (mode) ? ':' + mode : '';

    // Будем искать шаблоны по паре (name, mode), а потом по ('*', mode).
    var templates = this.get(lang, name + mode).concat(this.get(lang, '*' + mode));

    // Применяем первый подходящий (вернувший что-нибудь) шаблон.
    for (var i = 0, l = templates.length; i < l; i++) {
        var r = this._fillOne(templates[i], data, method);
        if (r) { return r; }
    }

    return '';
};

CodeTemplates._fillOne = function(template, data, method) {
    var defaults = template.defaults;

    var predicate = template.predicate;
    if (predicate) {
        predicate = CodeTemplates._evalLine(predicate, data);
        if (!eval(predicate)) { return ''; }
    }

    var lines = template.body.split(/\n/);
    var result = [];

    var skip;

    for (var i = 0, l = lines.length; i < l; i++) {

        var line = lines[i];

        // Пустые строки пропускаем только если прямо перед ними не было "пустого" oneExpr (см. ниже).
        if (/^\s*$/.test(line)) {
            if (!skip) {
                result.push(line);
            }
            continue;
        }
        skip = false;

        // Отрезаем начальный отступ. Он будет добавлен обратно после раскрытия всех %-выражений.
        var r = line.match(/^(\s*)(.*)\s*$/);
        var indent = r[1];
        line = r[2];

        line = CodeTemplates._evalLine(line, data, method);

        if (!line) {
            skip = true;
            continue;
        }

        // Индентим то, что получилось.
        /// line = line.toString().replace(/^/gm, indent);
        line = line.toString(); // FIXME: Из-за бага в node/v8 портятся некоторые строки.
                                //        До выяснения, отключаем красоты.

        result.push(line);
    }

    return result.join('\n')
        .replace(/\\\ /g, ' ')
        .replace(/^\ +$/gm, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

};

CodeTemplates._evalLine = function(line, data, method) {
    var r = line.split(/(\s*%(?:{.*?}|(?:\.|[\w-]+(?:\.[\w-]+)*)(?::[\w-]+)?(?:\(\))?))/);

    for (var i = 1, l = r.length; i < l; i += 2) {
        r[i] = CodeTemplates._evalMacro(r[i], data, method);
    }

    return r.join('')
        .replace(/^\s*/, '')
        .replace(/\s*$/, '');

};

// %foo
// %foo()
// %foo.bar
// %foo.bar()
// %foo:mode
// %.
// %.:mode
CodeTemplates._evalMacro = function(macro, data, method) {

    // %{Foo} -> %Foo
    var r = /^(\s*)%{(.*)}$/.exec(macro);
    if (r) {
        macro = r[1] + '%' + r[2];
    }

    r = /^(\s*)%(\.|[\w-]+(?:\.[\w-]+)*)(?::([\w-]+))?(\(\))?$/.exec(macro);

    if (!r) {
        console.log('MACRO ERROR', macro);
        return '';
    }

    var spaces = r[1];
    var path = r[2].split('.');
    var mode = r[3];
    var call = r[4];

    if (call) {
        call = path.pop();
    }
    call = call || method;

    // Вычисляем path относительно data (например, foo.bar -> data.foo.bar).
    var value = data;
    var step;
    while (value && (step = path.shift())) {
        if (step != '.') {
            value = value[step];
        }
    }

    if (value === undefined) { value = ''; }

    // Если после этого value все еще объект, то пытаемся применить call.
    // Либо тот, который был в %выражении (например, %foo.bar()),
    // либо же это предоопределенный метод, переданный в method (обычно это 'js' или 'yate').
    if (typeof value == 'object') {
        if (call) {
            value = (method == call) ? value[method]({ mode: mode }) : value[call]();
        } else if (method) {
            value = '';
        } else {
            value = true;
        }
    }

    if (method) {
        return (value !== '') ? spaces + value : '';
    } else {
        return JSON.stringify(value);
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

exports.CodeTemplates = CodeTemplates;

// ----------------------------------------------------------------------------------------------------------------- //

