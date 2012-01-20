// ----------------------------------------------------------------------------------------------------------------- //

/*

    Внутреннее представление Node:

        node = {
            data,           // Ссылка на собственно данные.
            parent,         // Ссылка на корневую ноду или null (в случае самой корневой ноды).
            name,           // Строка, содержащая имя ноды (то, что возвращает функция name() на этой ноде).
                            // В случае корневой ноды -- это пустая строка.
            root            // Ссылка на корень дерева.
        }

    Частный случай -- корневая нода дерева:

        root = {
            data: data,
            parent: null,
            name: '',
            root: root      // Кольцевая ссылка на саму себя.
        }

    Тип Nodeset представляет собой обычный массив, содержащий Node:

        nodeset = [ Node ]

*/

// ----------------------------------------------------------------------------------------------------------------- //

/*

    Внутреннее представление jpath:

        jpath = {
            steps,
            preds,
            abs
        }

        jpath = {

            // Список location steps. Всегда есть, кроме случаев '/' и '.'.
            // Например, для пути '/page/messages/message[flags/attachments]/id':
            steps: [
                'page',
                'messages',
                'message',
                'id'
            ],

            // Соответствующие предикаты. Каждый предикат -- это функция. Если какого-то предиката нет, то 0 или undefined.
            // Если ни одного предиката нет, то вместо всего массива будет просто 0 или undefined.
            preds: [
                0,
                0,
                // Предикат это функция, возвращающая Boolean. Параметры:
                //     context  -- контекстная нода, для которой вычисляется предикат;
                //     index    -- позиция ноды в выборке (считается с нуля);
                //     count    -- количество нод в выборке;
                // TODO: В случае, например, /page/items/item[4] в предикат писать просто 4.
                //       Это позволит не вычислять полностью весь nodeset, а сразу взять нужный элемент.
                function(context, index, count) {
                    var flags = context[0].flags;
                    return flags && flags.attachments;
                }
                // Для последнего шага 0 пропущен, так как больше предикатов нет.
            ],

            // Абсолютный (true) путь или относительный (false).
            abs: 1

        ]

    Примеры:

        .                       ->  { steps: [ . ] }
        /                       ->  { abs: 1 }
        /page/messages/message  ->  { steps: [ 'page', 'messages', 'message' ], abs: 1 }
        folders/folder[user]    ->  { steps: [ 'folders', 'folder' ], preds: [ 0, function(n) { return n[0].user; } ] }
        folders/folder          ->  { steps: [ 'folders', 'folder' ] }
        folders/*               ->  { steps: [ 'folders', '*' ] }
        ../folders/folder       ->  { steps: [ '..', 'folders', 'folder' ] }

*/

// ----------------------------------------------------------------------------------------------------------------- //

// Создаем из js-объекта корневую ноду.

function makeRoot(data) {
    return [
        {
            data: data,
            parent: null,
            name: ''
        }
    ];
};

// ----------------------------------------------------------------------------------------------------------------- //

function applyValue(nodeset, mode, attrs, _) {

    var modeMatcher = matcher[mode];
    if (!modeMatcher) { return undefined; }

    var args;
    var r = '';

    for (var index = 0, count = nodeset.length; index < count; index++) {
        var context = nodeset[index];
        var name = context.name || '';
        var templatesList = modeMatcher[name] || modeMatcher['*'] || [];

        for (var i = 0, l = templatesList.length; i < l; i++) {
            var template = templatesList[i];
            if (matched(template.jpath, context, index, count)) {
                if (_ !== undefined) {
                    if (!args) {
                        args = Array.prototype.slice.call(arguments, 3);
                    }
                    r += template.body.apply(null, [ context, attrs, index, count ].concat(args));
                } else {
                    r += template.body(context, attrs, index, count);
                }
                break;
            }
        }
        // FIXME: console.log('DEFAULT TEMPLATE');
    }

    return r;
}

// ----------------------------------------------------------------------------------------------------------------- //

function select(jpath, context) {

    var current = [ context ];
    var m = 1;

    var result;
    for (var i = 0, n = jpath.length; i < n; i += 2) {
        result = [];

        var type = jpath[i];
        var step = jpath[i + 1];

        switch (type) {

            case 0: // Это nametest (.foo или .*), в step 'foo' или '*'.
                for (var j = 0; j < m; j++) {
                    selectNametest(step, current[j], result);
                }
                break;

            case 1: // Это dots (., .., ...), в step количество шагов минус один ( . -- 0, .. -- 1, ... -- 2 и т.д. ).
                for (var j = 0; j < m; j++) {
                    var k = 0;
                    var node = context;
                    while (k < step && node) {
                        node = node.parent;
                        k++;
                    }
                    if (node) {
                        result.push(node);
                    }
                }
                break;

            case 2: // Это filter, в step предикат.
                for (var j = 0; j < m; j++) {
                    var node = current[j];
                    if (step(node, j, m)) { // Предикат принимает три параметра: node, index и count.
                        result.push(node);
                    }
                }
                break;

            case 3: // Это index, в step индекс нужного элемента.
                var node = current[step];
                result = (node) ? [node] : [];
                break;

        }

        current = result;
        m = current.length;

        if (!m) { return []; }
    }

    return result;
};

function selectContext(jpath, nodeset) {
    var result = [];
    for (var i = 0, n = nodeset.length; i < n; i++) {
        result = result.concat( select( jpath, nodeset[i] ) );
    }
    return result;
};

function selectNametest(step, context, result) {

    var data = context.data;

    if (typeof data !== 'object') { return; }

    if (step === '*') {
        for (step in data) {
            selectNametest(step, context, result);
        }
        return;
    }

    data = data[step];
    if (data === undefined) { return; }

    if (data instanceof Array) {
        for (var i = 0, l = data.length; i < l; i++) {
            result.push({
                data: data[i],
                parent: context,
                name: step
            });
        }
    } else {
        result.push({
            data: data,
            parent: context,
            name: step
        });
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

function join(left, right) {
    return left.concat(right);
}

// ----------------------------------------------------------------------------------------------------------------- //

function matched(jpath, context, index, count) {
    if (jpath === null) { // Это jpath /
        return !context.parent;
    }

    var l = jpath.length;
    var i = l - 2; // i всегда будет четное.
    var j = i;
    while (i >= 0) {
        if (!context) { return false; }

        var step = jpath[i]; // Тут step может быть либо 0 (nametest), либо 2 (predicate).
                             // Варианты 1 (dots) и 3 (index) в jpath'ах в селекторах запрещены.
        if (step === 0) { // Nametest.
            var name = jpath[i + 1];
            if ( name !== '*' && name !== context.name ) { return false; }
            for (var k = i + 2; k <= j; k += 2) {
                var predicate = jpath[k + 1];
                if (!predicate(context, index, count)) { return false; }
            }
            context = context.parent;
            j = i;
        }

        i -= 2;
    }

    return true;
};

// ----------------------------------------------------------------------------------------------------------------- //

function nodeValue(node) {
    var data = node.data;
    return (typeof data == 'object') ? '': data;
};

// ----------------------------------------------------------------------------------------------------------------- //

function nodeset2scalar(nodeset) {
    if (!nodeset.length) { return ''; }

    var data = nodeset[0].data;
    return (typeof data == 'object') ? '': data;
};

function nodeset2boolean(nodeset) {
    return (nodeset.length > 0);
};

function nodeset2xml(nodeset) {
    return scalar2xml( nodeset2scalar(nodeset) );
};

function nodeset2attrvalue(nodeset) {
    return scalar2attrvalue( nodeset2scalar(nodeset) );
};

function scalar2xml(scalar) {
    return scalar
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

function scalar2attrvalue(scalar) {
    return scalar
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// ----------------------------------------------------------------------------------------------------------------- //

var shortTags = {
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    wbr: true
};

function closeAttrs(a) {
    var name = a.start;

    if (name) {
        var r = '';
        var attrs = a.attrs;

        for (var attr in attrs) {
            r += ' ' + attr + '="' + attrQuote(attrs[attr]) + '"';
        }
        r += (shortTags[name]) ? '/>' : '>';
        a.start = null;

        return r;
    }

    return '';
};

function copyAttrs(to, from) {
    for (var key in from) {
        to[key] = from[key];
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

function attrQuote(s) {
    if (!s) { return ''; }
    s = s.toString();
    s = s.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    return s;
}

function textQuote(s) {
    if (!s) { return ''; }
    s = s.toString();
    s = s.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    return s;
}

function slice(s, from, to) {
    s = s.toString();
    return (to) ? s.slice(from, to) : s.slice(from);
}

function grep(nodeset, predicate) {
    var r = [];
    for (var index = 0, count = nodeset.length; index < count; index++) {
        var node = nodeset[index];
        if (predicate(node, index, count)) {
            r.push(node);
        }
    }
    return r;
}

function byIndex(nodeset, i) {
    return nodeset.slice(i, i + 1);
}
