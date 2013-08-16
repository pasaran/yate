var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

function Codegen(lang, filename) {
    this.lang = lang;

    this._mid = 0;
    this._mids = {};
    this._macros = [];

    this._read_templates(filename);
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Читаем шаблоны из файла и складываем их в хранилище.
//
Codegen.prototype._read_templates = function(filename) {
    var content = fs_.readFileSync(filename, 'utf-8');

    //  Удаляем комментарии -- строки, начинающиеся на //.
    content = content.replace(/^\/\/.*\n/gm, '');

    // Разбиваем на отдельные шаблоны.
    var parts = content.match(/^\S.*\n(\n|    .*\n)+/gm);

    var templates = {};

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

        var r = /^([\w-]+|\*)\ *(?::([\w-]+))?\ *(?:\[(.*)\])?\n([\S\s]*)$/.exec(part);

        if (!r) {
            throw new Error('Ошибка синтаксиса шаблона:\n' + part);
        }

        var id = r[1];
        var mode = r[2] || '';
        var predicate = ( r[3] || '' ).trim();
        var body = r[4];

        //  Убираем отступ и переводы строк.
        body = body.replace(/^    /gm, '')
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');

        var key = id + ':' + mode;

        var key_templates = templates[key] || (( templates[key] = [] ));

        key_templates.push({
            predicate: predicate,
            body: body
        });

    }

    var body = '\nvar templates = {};';
    for (var key in templates) {
        var key_templates = templates[key];

        body += 'templates[' + JSON.stringify(key) + '] = function(ast) {';
        body += 'var line, result, i;';

        for (var i = 0, l = key_templates.length; i < l; i++) {
            var template = key_templates[i];

            var compiled = this.compile_template(template.body);

            body += 'result = ""; i = 0;';

            if (template.predicate) {
                body += 'if (' + template.predicate + ') { ' + compiled + ' }';
            } else {
                body += compiled;
            }
        }

        body += '};\n';
    }
    body += 'return templates;';

    body = this._macros.join('\n') + body;

    //  console.error(body);

    this._templates = ( new Function(body) )();
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Находим подходящий шаблон, соответствующий паре name/mode. И заполняем его данными из ast.
Codegen.prototype.generate = function(id, ast, mode) {
    var key = id + ':' + (mode || '');

    var template = this._templates[key];
    if (template) {
        return template(ast);
    }

    key = '*:' + (mode || '');
    template = this._templates[key];
    if (template) {
        return template(ast);
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

Codegen.prototype.compile_template = function(template) {
    var lines = template.split('\n');

    var body = '';

    body += 'result = [];';

    for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];

        if ( /%{.*?}/.test(line) ) {
            var r = /^(\s*)(.*)$/.exec(line);

            var indent = r[1];
            var content = r[2];

            body += 'line = ' + this.compile_line(content) + ';\n';
            if (indent) {
                body += 'if (line) { line = line.replace(/^/gm, ' + JSON.stringify(indent) + '); result.push(line); }\n';
            } else {
                body += 'if (line) { result.push(line); }\n';
            }
        } else {
            body += 'result.push(' + JSON.stringify(line) + ');\n';
        }
    }

    body += 'return result.join("\\n");\n';

    return body;
};

Codegen.prototype.compile_line = function(line) {
    var parts = line.split(/%{\s*(.*?)\s*}/g);

    var compiled = [];
    for (var i = 0, l = parts.length; i < l; i++) {
        if (i % 2) {
            var macro = parts[i];

            var r = macro.split(/\s*:\s*/);

            var path = r[0];
            var mode = r[1] || '';

            var mid = this.compile_macro(path, mode);
            compiled.push( mid + '(ast)' );
        } else {
            var str = parts[i];
            if (str) {
                compiled.push( JSON.stringify(str) );
            }
        }
    }

    return compiled.join(' + ');
};

Codegen.prototype.compile_macro = function(path, mode) {
    var key = path + ':' + mode;

    var mid = this._mids[key];

    if (!mid) {
        var body = '';

        var lang = JSON.stringify(this.lang);

        mode = JSON.stringify(mode);

        if (path === '.') {
            body += 'return ast.code(' + lang + ', ' + mode + ');';

        } else {
            path = path.split('.');

            if (path.length === 0) {
                body += 'return ast[' + JSON.stringify(method) + ']();';

            } else {
                if ( path[0] === '~' ) {
                    path.shift();

                    body += 'ast = ast.parent;';
                }

                var method;
                if ( /\(\)$/.test( path[ path.length - 1 ] ) ) {
                    method = path.pop();
                    method = method.slice(0, -2);
                }

                for (var i = 0, l = path.length; i < l; i++) {
                    body += 'ast = ast[' + JSON.stringify( path[i] ) + '];';
                    body += 'if (ast === undefined) { return ""; }';
                }

                if (method) {
                    body += 'if (typeof ast === "object") { return ast[' + JSON.stringify(method) + '](); }';
                    body += 'return "";';
                } else {
                    body += 'if (typeof ast === "object") { return ast.code(' + lang + ', ' + mode + '); }';
                    body += 'return ast;';
                }

            }
        }

        mid = this.store_macro(key, body);
    }

    return mid;
};

Codegen.prototype.store_macro = function(key, body) {
    var mid = 'm' + this._mid++;

    this._macros.push( 'function ' + mid + '(ast) { ' + body + ' }' );
    this._mids[key] = mid;

    return mid;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Codegen;

//  ---------------------------------------------------------------------------------------------------------------  //

