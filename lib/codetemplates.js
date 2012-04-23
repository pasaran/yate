//  ---------------------------------------------------------------------------------------------------------------  //
//  codetemplates
//  ---------------------------------------------------------------------------------------------------------------  //

var _templates = {};

//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

//  Добавляем шаблон в хранилище.
function addTemplate(lang, id, template) {
    var templates = _templates[lang];
    if (!templates) {
        templates = _templates[lang] = {};
    }

    var items = templates[id];
    if (!items) {
        items = templates[id] = [];
    }

    items.push(template);
}

//  Возвращаем все шаблоны для данных lang и id.
function getTemplates(lang, id) {
    var templates = _templates[lang];
    if (!templates) {
        //  Если шаблонов еще нет, читаем их из файла.
        templates = readTemplates(lang);
    }

    return templates[id] || [];
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Читаем шаблоны из соответствующего файла и складываем их в хранилище.
function readTemplates(lang) {

    var filename = __dirname + '/templates/' + lang + '.tmpl';
    var content = fs_.readFileSync(filename, 'utf-8');

    //  Удаляем комментарии -- строки, начинающиеся на //.
    content = content.replace(/^\/\/.*\n/gm, '');

    // Разбиваем на отдельные шаблоны.
    var parts = content.match(/^\S.*\n(\n|    .*\n)+/gm);

    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];

        //  Каждый шаблон устроен следующим образом:
        //
        //      description
        //          body
        //
        //  description -- это одна строка, состоящая из имени шаблона, моды и предиката. Например:
        //
        //      item :content [ this.Count > 0 ]
        //
        //  При этом только имя обязательно
        //
        //  body -- это текст, состоящий либо из пустых строк, либо из строк, отбитых четырьмя пробелами.

        var r = /^([\w-]+|\*)\ *(:[\w-]+)?\ *(\[.*\])?\n([\S\s]*)$/.exec(part);

        if (!r) {
            throw new Error('Ошибка синтаксиса шаблона:\n' + part);
        }

        //  id = name + mode (например, item:content или item:, если моды нет).
        var id = r[1] + (r[2] || ':');

        var predicate = r[3];
        if (predicate) {
            predicate = predicate.slice(1, -1);
            //  Отрезаем '[' и ']'.
            predicate = new Function( 'return !!(' + predicate + ');' );
        }

        //  Убираем отступ и переводы строк.
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

    return _templates[lang];

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Находим подходящий шаблон, соответствующий паре name/mode. И заполняем его данными из data.
function fillTemplate(lang, name, mode, data) {
    var suffix = ':' + mode;

    //  Берем все шаблоны для foo:bar и для *:bar
    var templates = []
        .concat( getTemplates( lang, name + suffix ) )
        .concat( getTemplates( lang, '*' + suffix ) );

    //  Применяем первый подходящий (вернувший что-нибудь) шаблон.
    for (var i = 0, l = templates.length; i < l; i++) {
        var r = doTemplate( lang, templates[i], data );
        if (r !== undefined) { return r; }
    }

    //  FIXME: Не нужно ли тут вернуть '' в любом случае?
    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Собственно код, который заполняет шаблон данными.
function doTemplate(lang, template, data) {

    //  Если есть предикат, проверяем его истинность.
    var predicate = template.predicate;
    if ( predicate && !predicate.call(data) ) {
        return;
    }

    var lines = template.body.split(/\n/);
    var result = [];

    var skip;

    for (var i = 0, l = lines.length; i < l; i++) {

        var line = lines[i];

        //  Пустые строки пропускаем только если прямо перед ними не было "пустой" doLine() (см. ниже).
        if (/^\s*$/.test(line)) {
            if (!skip) {
                result.push(line);
            }
            continue;
        }
        skip = false;

        //  Отрезаем начальный отступ. Он будет добавлен обратно после раскрытия всех макросов.
        var r = line.match(/^(\s*)(.*)\s*$/);
        var indent = r[1];
        line = r[2];

        //  Раскрываем макросы в строке.
        line = doLine(lang, line, data);
        if (!line) {
            //  Строка после раскрытия всех макросов стала пустой.
            //  Пропускаем ее и все проследующие пустые строки.
            skip = true;
            continue;
        }

        /*
            //  FIXME: Из-за бага в node/v8 портятся некоторые строки.

            //  Индентим то, что получилось.
            //  line = line.toString().replace(/^/gm, indent);
        */
        //  Индентим то, что получилось. Ручная версия.
        var _lines = line.toString().split('\n');
        for (var j = 0, m = _lines.length; j < m; j++) {
            _lines[j] = indent + _lines[j];
        }
        line = _lines.join('\n');

        result.push(line);
    }

    return result.join('\n')
        //  Чтобы вставить пробел в начале строки, его приходится эскейпить в виде '\ '.
        .replace(/\\\ /g, ' ')
        .replace(/^\ +$/gm, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

};

//  Раскрываем макросы в строке. Макросы начинаются символом % и дальше более-менее похожи на xpath/jpath. Варианты:
//
//      %{ Foo }        -- если data.Foo это скаляр, то вывести его, если это объект, то вызвать метод data.Foo.code(lang).
//      %{ Foo :mode }  -- тоже самое, но в code передается еще и mode: data.Foo.code(lang, mode).
//      %{ Foo.Bar }    -- тоже самое, но про data.Foo.Bar.
//      %{ . :mode }    -- обработать эту же data еще раз, но с другой модой.
//      %{ foo() }      -- результат data.foo().
//      %{ Foo.bar() }  -- результат data.Foo.bar() (в предположении, что data.Foo объект).
//
function doLine(lang, line, data) {
    var r = line.split(/(\s*%{.*?})/);

    for (var i = 1, l = r.length; i < l; i += 2) {
        r[i] = doMacro(lang, r[i], data);
    }

    return r.join('')
        //  FIXME: А нужно ли это вообще? Из-за этого портятся string_literal.
        .replace(/^\s*/, '')
        .replace(/\s*$/, '');

}

function doMacro(lang, macro, data) {
    var r = /^(\s*)%{\s*(\.|[\w-]+(?:\.[\w-]+)*)(\(\))?\s*(?::([\w-]+))?\s*}$/.exec(macro);

    if (!r) {
        console.log('MACRO ERROR', macro);
        return '';
    }

    var spaces = r[1];
    var path = r[2].split('.');
    var call = r[3];
    var mode = r[4];

    if (call) {
        call = path.pop();
    }

    //  Вычисляем path относительно data (например, 'foo.bar' -> data.foo.bar).
    var value = data;
    var step;
    while ( value && (( step = path.shift() )) ) {
        if (step !== '.') {
            value = value[step];
        }
    }
    if (value === undefined) { value = ''; }

    if (typeof value === 'object') {
        if (call) {
            value = value[call]();
        } else {
            value = value.code(lang, mode);
        }
    }

    return (value !== '') ? spaces + value : '';
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = fillTemplate;

//  ---------------------------------------------------------------------------------------------------------------  //

