// ----------------------------------------------------------------------------------------------------------------- //
// yate.codetemplates
// ----------------------------------------------------------------------------------------------------------------- //

yate.codetemplates = {
    _templates: {}
};

// ----------------------------------------------------------------------------------------------------------------- //

// Добавляем шаблон в хранилище.
yate.codetemplates.addTemplate = function(lang, id, template) {
    var templates = this._templates[lang];
    if (!templates) {
        templates = this._templates[lang] = {};
    }

    var items = templates[id];
    if (!items) {
        items = templates[id] = [];
    }

    items.push(template);
};

// Возвращаем все шаблоны для данных lang и id.
yate.codetemplates.getTemplates = function(lang, id) {
    var templates = this._templates[lang];
    if (!templates) { // Если шаблонов еще нет, читаем их из файла.
        templates = this.read(lang);
    }

    return templates[id] || [];
};

// ----------------------------------------------------------------------------------------------------------------- //

// Читаем шаблоны из соответствующего файла и складываем их в хранилище.
yate.codetemplates.read = function(lang) {

    var filename = __dirname + '/templates/' + lang + '.tmpl';
    var content = require('fs').readFileSync(filename, 'utf-8');

    // Удаляем комментарии -- строки, начинающиеся на //.
    content = content.replace(/^\/\/.*\n/gm, '');

    // Разбиваем на отдельные шаблоны.
    var parts = content.match(/^\S.*\n(\n|    .*\n)+/gm);

    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];

        // Каждый шаблон устроен следующим образом:
        // description
        //     body
        //
        // description -- это одна строка, состоящая из имени шаблона, моды и предиката. Например:
        // item #content [ %Count > 0 ] ( %Title = 'Hello', %Value = '42' )
        // При этом только имя обязательно
        //
        // body -- это текст, состоящий либо из пустых строк, либо из строк, отбитых четырьмя пробелами.

        var r = /^([\w-]+|\*)\ *(#[\w-]+)?\ *(\[.*\])?\n([\S\s]*)$/.exec(part);

        if (!r) {
            throw new Error("Ошибка синтаксиса шаблона:\n" + part);
        }

        // id = name + mode (например, item#content или item#, если моды нет).
        var id = r[1] + (r[2] || '#');

        var predicate = r[3];
        if (predicate) {
            predicate = predicate.slice(1, -1); // Отрезаем [ и ].
        }

        // Убираем отступ и переводы строк.
        var body = r[4]
            .replace(/^    /gm, '')
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');

        this.addTemplate(lang, id, {
            name: r[1],
            mode: r[2],
            predicate: predicate,
            body: body
        });
    }

    return this._templates[lang];

};

// ----------------------------------------------------------------------------------------------------------------- //

// Находим подходящий шаблон, соответствующий паре name/mode. И заполняем его данными из data.
yate.codetemplates.fill = function(lang, name, mode, data) {
    var suffix = '#' + mode;

    // Берем все шаблоны для foo#bar и для *#bar
    var templates = this.getTemplates( lang, name + suffix );
    templates = templates.concat( this.getTemplates( lang, '*' + suffix ) );

    // Применяем первый подходящий (вернувший что-нибудь) шаблон.
    for (var i = 0, l = templates.length; i < l; i++) {
        var r = this._fillOne( lang, templates[i], data );
        if (r !== undefined) { return r; }
    }
};

// Собственно код, который заполняет шаблон данными.
yate.codetemplates._fillOne = function(lang, template, data) {

    // Если есть предикат, проверяем его истинность.
    var predicate = template.predicate;
    if (predicate) {
        predicate = yate.codetemplates._evalLine(lang, predicate, data, true);
        if (!eval(predicate)) { return; }
    }

    var lines = template.body.split(/\n/);
    var result = [];

    var skip;

    for (var i = 0, l = lines.length; i < l; i++) {

        var line = lines[i];

        // Пустые строки пропускаем только если прямо перед ними не было "пустой" _evalLine (см. ниже).
        if (/^\s*$/.test(line)) {
            if (!skip) {
                result.push(line);
            }
            continue;
        }
        skip = false;

        // Отрезаем начальный отступ. Он будет добавлен обратно после раскрытия всех макросов.
        var r = line.match(/^(\s*)(.*)\s*$/);
        var indent = r[1];
        line = r[2];

        line = yate.codetemplates._evalLine(lang, line, data); // Раскрываем макросы в строке.
        if (!line) { // Строка после раскрытия всех макросов стала пустой. Пропускаем ее и все проследующие пустые строки.
            skip = true;
            continue;
        }

        /*
            // FIXME: Из-за бага в node/v8 портятся некоторые строки.

            // Индентим то, что получилось.
            /// line = line.toString().replace(/^/gm, indent);
            /// line = line.toString();
        */
        // Индентим то, что получилось. Ручная версия.
        var _lines = line.toString().split('\n');
        for (var j = 0, m = _lines.length; j < m; j++) {
            _lines[j] = indent + _lines[j];
        }
        line = _lines.join('\n');

        result.push(line);
    }

    return result.join('\n')
        .replace(/\\\ /g, ' ') // Чтобы вставить пробел в начале строки, его приходится эскейпить.
        .replace(/^\ +$/gm, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

};

// Раскрываем макросы в строке. Макросы начинаются символом % и дальше более-менее похожи на xpath/jpath. Варианты:
//
//     %Foo         -- если data.Foo это скаляр, то вывести его, если это объект, то вызвать метод data.Foo.code(lang).
//     %{Foo}       -- тоже самое, скобочки нужны для ситуация вроде %{Foo}Bar (чтобы не слипалось :).
//     %Foo#mode    -- тоже самое, но в code передается еще и mode: data.Foo.code(lang, mode).
//     %Foo.Bar     -- тоже самое, но про data.Foo.Bar.
//     %.#mode      -- обработать эту же data еще раз, но с другой модой.
//     %foo()       -- результат data.foo().
//     %Foo.bar()   -- результат data.Foo.bar() (в предположении, что data.Foo объект).
//
yate.codetemplates._evalLine = function(lang, line, data, asPredicate) {
    var r = line.split(/(\s*%(?:{.*?}|(?:\.|[\w-]+(?:\.[\w-]+)*)(?:#[\w-]+)?(?:\(\))?))/);

    for (var i = 1, l = r.length; i < l; i += 2) {
        r[i] = yate.codetemplates._evalMacro(lang, r[i], data, asPredicate);
    }

    return r.join('')
        .replace(/^\s*/, '') // А нужно ли это вообще? Из-за этого портятся string_literal.
        .replace(/\s*$/, '');

};

yate.codetemplates._evalMacro = function(lang, macro, data, asPredicate) {

    // %{Foo} -> %Foo
    var r = /^(\s*)%{(.*)}$/.exec(macro);
    if (r) {
        macro = r[1] + '%' + r[2];
    }

    r = /^(\s*)%(\.|[\w-]+(?:\.[\w-]+)*)(?:#([\w-]+))?(\(\))?$/.exec(macro);

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

    // Вычисляем path относительно data (например, foo.bar -> data.foo.bar).
    var value = data;
    var step;
    while (value && (step = path.shift())) {
        if (step != '.') {
            value = value[step];
        }
    }

    if (value === undefined) { value = ''; }

    if (typeof value == 'object') {
        if (call) {
            value = value[call]();
        } else {
            value = value.code(lang, mode);
        }
    }

    if (asPredicate) {
        return JSON.stringify(value);
    } else {
        return (value !== '') ? spaces + value : '';
    }

};

