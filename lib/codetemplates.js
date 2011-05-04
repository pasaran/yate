// CodeTemplates

// ----------------------------------------------------------------------------------------------------------------- //

Yate.CodeTemplates = {
    _templates: {}
};

// ----------------------------------------------------------------------------------------------------------------- //

/*
    _templates = {
        lang: {
            id: []
        }
    }
*/

Yate.CodeTemplates._$ = function(lang, id, value) {
    var templates = this._templates[lang];
    if (!templates) {
        templates = this._templates[lang] = {};
        this.read(lang);
    }

    var items = templates[id];
    if (!items) {
        items = templates[id] = [];
    }

    if (value) {
        items.push(value);
    }

    return items;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.CodeTemplates.read = function(lang, filename) {

    filename = filename || __dirname + '/templates/' + lang + '.tmpl';

    var templates = this._templates[lang];

    var content = require('fs').readFileSync(filename, 'utf-8');
    var parts = content.split(/\s*-{10,}\s*/m);

    var r;
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];
        if (/^\s*$/.test(part)) { continue; }

        r = /^([\w-]+):\n+([\S\s\n]*)$/m.exec(part) || /^([\w-]+):\s+(.*)$/m.exec(part);
        if (r) {
            this._$(lang, r[1], r[2]);
        }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.CodeTemplates.fill = function(lang, id, data, method) {
    var templates = this._$(lang, id);
    if (!templates) { return ''; }

    for (var i = 0, l = templates.length; i < l; i++) {
        var r = this._fillOne(templates[i], data, method);
        if (r) { return r; }
    }

    return '';
};

Yate.CodeTemplates._fillOne = function(template, data, method) {
    var lines = template.split(/\n/);

    var skipTemplate = false;
    var skipEmpty = false;

    var r = [];

    for (var i = 0, l = lines.length; i < l; i++) {
        var skipLine = false;

        var line = lines[i];

        if (/^\s*$/.test(line)) {
            if (!skipEmpty) {
                r.push(line);
            }
            continue;
        }
        skipEmpty = false;

        line = line.replace(/(^\s*)?%([!?])?({[^}]*}|[\w-]+(?:\.[\w-]+)*)(\(\))?/mg, function(_, indent, options, path, call) {

            indent = indent || '';

            if (/^{/.test(path)) {
                var r = /{([\w-]+(?:\.[\w-]+)*)(\(\))?}/.exec(path);
                path = r[1];
                call = r[2];
            }

            path = path.split(/\./);

            if (call) {
                call = path.pop();
            } else {
                call = method;
            }

            var value = data;
            while (value && path.length) {
                var step = path.shift();
                value = value['$' + step];
            }

            if (value && typeof value == 'object') {
                if (call && typeof value[call] == 'function') {
                    value = value[call]();
                } else {
                    value = undefined;
                }
            }

            if (value === undefined || value === '') {
                if (options == '!') {
                    skipTemplate = true;
                }
                if (options == '?') {
                    skipLine = true;
                }
                return '';
            }

            return value.toString().replace(/^/gm, indent);
        });

        if (skipLine) {
            skipEmpty = true;
            continue;
        }

        if (skipTemplate) {
            return false;
        }

        r.push(line);
    }

    r = r.join('\n');

    r = r.replace(/\\\ /g, ' ');
    r = r.replace(/^\ +$/gm, '');
    r = r.replace(/^\n+/, '');
    r = r.replace(/\n+$/, '');

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

