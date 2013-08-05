var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

var pt = require('./pt.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  pt.Codegen
//  ---------------------------------------------------------------------------------------------------------------  //

pt.Codegen = function(lang, filename) {
    this.lang = lang;
    this._templates = {};
    this._readTemplates(filename);
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Добавляем шаблон в хранилище.
pt.Codegen.prototype._addTemplate = function(id, template) {
    var templates = this._templates[id] || (( this._templates[id] = [] ));
    templates.push(template);
};

//  Возвращаем все шаблоны для данного id.
pt.Codegen.prototype._getTemplate = function(id) {
    return this._templates[id] || [];
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Читаем шаблоны из файла и складываем их в хранилище.
pt.Codegen.prototype._readTemplates = function(filename) {
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
            predicate = new Function('a', 'p', 'f', 'return !!(' + predicate + ');' );
        }

        //  Убираем отступ и переводы строк.
        var body = r[4]
            .replace(/^    /gm, '')
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');

        this._addTemplate(id, {
            name: r[1],
            mode: r[2],
            predicate: predicate,
            body: body
        });
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Находим подходящий шаблон, соответствующий паре name/mode. И заполняем его данными из ast.
pt.Codegen.prototype.generate = function(name, ast, mode) {
    var suffix = ':' + (mode || '');

    //  Берем все шаблоны для foo:bar и для *:bar
    var templates = []
        .concat( this._getTemplate(name + suffix) )
        .concat( this._getTemplate('*' + suffix) );

    //  Применяем первый подходящий (вернувший что-нибудь) шаблон.
    for (var i = 0, l = templates.length; i < l; i++) {
        var r = this._doTemplate( templates[i], ast );
        if (r !== undefined) { return r; }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Собственно код, который заполняет шаблон данными.
pt.Codegen.prototype._doTemplate = function(template, ast) {

    //  Если есть предикат, проверяем его истинность.
    var predicate = template.predicate;
    if ( predicate && !predicate(ast, ast.p, ast.f) ) {
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
        line = this._doLine(line, ast);
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
//      %{ Foo }        -- если ast.Foo это скаляр, то вывести его, если это объект, то вызвать метод ast.p.Foo.code(lang).
//      %{ Foo :mode }  -- тоже самое, но в code передается еще и mode: ast.p.Foo.code(lang, mode).
//      %{ Foo.Bar }    -- тоже самое, но про ast.p.Foo.p.Bar.
//      %{ . :mode }    -- обработать этот же ast еще раз, но с другой модой.
//      %{ foo() }      -- результат ast.foo().
//      %{ Foo.bar() }  -- результат ast.p.Foo.bar() (в предположении, что ast.p.Foo объект).
//
pt.Codegen.prototype._doLine = function(line, ast) {
    var r = line.split(/(\s*%{.*?})/);

    for (var i = 1, l = r.length; i < l; i += 2) {
        r[i] = this._doMacro(r[i], ast);
    }

    return r.join('')
        //  FIXME: А нужно ли это вообще? Из-за этого портятся string_literal.
        .replace(/^\s*/, '')
        .replace(/\s*$/, '');

};

pt.Codegen.prototype._doMacro = function(macro, ast) {
    var r = /^(\s*)%{\s*(\.|[\w~-]+(?:\.[\w-]+)*)(\(\))?\s*(?::([\w-]+))?\s*}$/.exec(macro);

    if (!r) {
        throw new Error('MACRO ERROR: ' + macro);
    }

    var spaces = r[1];
    var path = r[2].split('.');
    var call = r[3];
    var mode = r[4];

    if (call) {
        call = path.pop();
    }

    //  Вычисляем path относительно ast (например, 'Foo.Bar' -> ast.p.Foo.p.Bar).
    var value = ast;
    var step;
    while ( value && (( step = path.shift() )) ) {
        if (step === '~') {
            value = value.parent;
            continue;
        }
        if (step !== '.') {
            value = value.p[step];
        }
    }
    if (value === undefined) { value = ''; }

    if (typeof value === 'object') {
        if (call) {
            value = value[call]();
        } else {
            value = value.code(this.lang, mode);
        }
    }

    return (value !== '') ? spaces + value : '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

