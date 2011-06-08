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

        r = /^([\w-]+|\*)\ *(#[\w-]+)?\ *(\[.*\])?\ *(\(.*\))?\n([\S\s]*)$/.exec(part);

        if (!r) {
            throw new Error("Ошибка синтаксиса в CodeTemplates:\n" + part);
        }

        // id = name | name#mode
        var id = r[1] + (r[2] || "");

        var predicate = r[3];
        if (predicate) {
            predicate = predicate.slice(1, -1);
        }

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
            predicate: predicate,
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
            var v = data[s];
            if (v === undefined) { v = defaults[s]; }
            if (v === undefined) { return 'false'; }

            return (typeof v == 'object') ? 'true' : JSON.stringify(v);
        });

        // console.log('EVIL', template.name, JSON.stringify(predicate), eval(predicate) === false);
        if (eval(predicate) === false) { return ''; }
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

        var oneExpr;
        // Вся строка состоит из одного %-выражения и все. Например:
        //     %Defs
        // Если Defs не определено, то нужно пропустить всю строчку, а также все пустые строки после нее.
        // Мы ищем выражение либо вида %{...}, либо %foo, %foo.bar, ..., либо %foo(), %foo.bar(), ...
        if (/^\s*%({[^}]*}|[\w-]+(?:\.[\w-]+)*(\(\))?)\s*$/.test(line)) {
            oneExpr = true;
        }

        line = line.replace(/(\s*)%({[^}]*}|[\w-]+(?:\.[\w-]+)*(\(\))?)/mg, function(_, spaces, path) {

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

            return spaces + value;

        });

        if (skip) {
            continue;
        }

        line = line.replace(/^\s*/, '').replace(/\s*$/, '');

        // Индентим то, что получилось.
        if (!/^\s*$/.test(line)) {
            line = line.toString().replace(/^/gm, indent);
        }

        result.push(line);
    }

    return result.join('\n')
        .replace(/\\\ /g, ' ')
        .replace(/^\ +$/gm, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

};

// ----------------------------------------------------------------------------------------------------------------- //

exports.CodeTemplates = CodeTemplates;

// ----------------------------------------------------------------------------------------------------------------- //

