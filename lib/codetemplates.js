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

    return templates[id];
};

// ----------------------------------------------------------------------------------------------------------------- //

CodeTemplates.read = function(lang, filename) {

    filename = filename || __dirname + '/../templates/' + lang + '.tmpl';
    // filename = filename || __dirname + '/templates/' + lang + '.tmpl';

    var content = Fs.readFileSync(filename, 'utf-8');

    // Удаляем комментарии.
    content = content.replace(/^#.*\n/gm, '');

    // Разбиваем на отдельные шаблоны.
    var parts = content.match(/^\w.*\n(\n|    .*\n)+/gm);

    var r;
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];

        // Каждый шаблон устроен следующим образом:
        // description
        //     body
        //
        // description -- это одна строка, состоящая из имени, моды, предиката и дефолтных значений. Например:
        // item #content [ %Count > 0 ] ( %Title = "Hello", %Value = "42" )
        // При этом только имя обязательно
        //
        // body -- это текст, состоящий либо из пустых строк, либо из строк, отбитых четырьмя пробелами.

        r = /^([\w-]+|\*)\s*(#[\w-]+)?\s*(\[.*\])?\s*(\(.*\))?\n([\S\s]*)$/m.exec(part);

        if (!r) {
            throw new Error("Ошибка синтаксиса в CodeTemplates:\n" + part);
        }

        // id = name | name#mode
        var id = r[1] + (r[2] || "");

        // Преобразовываем строку вида ' %Title = "Hello", %Value = "42" ' в объект.
        var defaults = {};
        if (r[4]) {
            var list = r[4].split(/%([\w-]+)\s*=\s*"(.*?)"/g);
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
            predicate: r[3],
            defaults: defaults,
            body: body
        });
    }

    return this._templates[lang];

};

// ----------------------------------------------------------------------------------------------------------------- //

CodeTemplates.fill = function(lang, name, mode, data, method) {
    mode = (mode) ? "#" + mode : "";

    // Будем искать шаблоны по паре (name, mode), а потом по ('*', mode).
    var templates = this.get(lang, name + mode).concat(this.get(lang, '*' + mode));

    if (!templates) { return ''; }

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
        predicate = predicate.replace(/%([\w-]+)/g, function(_, s) {
            var v = data[s] || defaults[s];
            if (!v) { return 'false'; }

            return (typeof v == 'object') ? 'true' : v;
        });

        if (!eval(predicate)) { return ''; }
    }

    var lines = template.body.split(/\n/);
    var r = [];

    var skip;

    for (var i = 0, l = lines.length; i < l; i++) {

        var line = lines[i];

        // Пустые строки пропускаем только если прямо перед ними не было "пустого" oneExpr (см. ниже).
        if (/^\s*$/.test(line)) {
            if (!skip) {
                r.push(line);
            }
            continue;
        }
        skip = false;

        var oneExpr;
        // Вся строка состоит из одного %-выражения и все. Например:
        //     %Defs
        // Если Defs не определено, то нужно пропустить всю строчку, а также все пустые строки после нее.
        // Мы ищем выражение либо вида %{...}, либо %foo, %foo.bar, ..., либо %foo(), %foo.bar(), ...
        if (/^\s*%({[^}]*}|[\w-]+(?:\.[\w-]+)*(\(\))?)\s*$/.test(line)) {
            oneExpr = true;
        }

        line = line.replace(/(^\s*)?%({[^}]*}|[\w-]+(?:\.[\w-]+)*(\(\))?)/mg, function(_, indent, path) {

            indent = indent || '';

            // Вытаскиваем выражение из {...}.
            if (/^{/.test(path)) {
                path = path.slice(1, -1);
            }

            // Отрезаем конечные () и выставляем соответствующий флаг.
            var call;
            if (/\(\)$/.test(path)) {
                path = path.slice(0, -2);
                call = true;
            }

            path = path.split(/\./);
            call = (call) ? path.pop() : method;

            // Вычисляем path относительно data (например, data.foo.bar).
            var value = data;
            var step;
            while (value && (step = path.shift())) {
                value = value[step];
            }

            // Если после этого value все еще объект, то пытаемся применить call.
            // Либо тот, который был в %выражении (например, %foo.bar()),
            // либо же это предоопределенный метод, переданный в method (обычно это 'js' или 'yate').
            if (value && typeof value == 'object') {
                if (call && typeof value[call] == 'function') {
                    value = value[call]();
                } else {
                    value = undefined;
                }
            }

            if (value === undefined || value === '') {
                // В этой строчке только одно выражение и оно "пустое".
                // Пропускаем всю строчку и все последующие пустые строчки, чтобы не создавать лишних пробелов в коде.
                if (oneExpr) {
                    skip = true;
                }
                return '';
            }

            // Индентим то, что получилось.
            return value.toString().replace(/^/gm, indent);
        });

        if (skip) {
            continue;
        }

        r.push(line);
    }

    r = r.join('\n')
        .replace(/\\\ /g, ' ')
        .replace(/^\ +$/gm, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

exports.CodeTemplates = CodeTemplates;

// ----------------------------------------------------------------------------------------------------------------- //

