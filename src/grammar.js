/*
    TODO:
      * Новый синтаксис для jpath.
            .               .
            .foo            foo
            .foo.bar        foo/bar

            ..              ..
            ..foo           ../foo
            ...             ../..
            ...foo          ../../foo
            ...foo...bar    ../../foo/../../bar

            /               /
            /.
            /..
            /.foo           /foo
            /.foo.bar       /foo/bar

            foo()[ .count > 0 ]

      * Переменные без $.
            a = 42
            b = a + 24

      * Обязательные {...} в блоках.
            if count > 0 {
                // ...
            }

      * apply {...} и apply [...].
            apply {
                "foo": 42
            }

            apply [
                1
                2
                3
            ]

      * .item[ .count ] vs. .item[ count ].
*/


// ################################################################################################################# //
//
// Grammar
//
// ################################################################################################################# //

Yate.Grammar = {};

// ----------------------------------------------------------------------------------------------------------------- //

// Tokens

Yate.Grammar.tokens = {
    QNAME: /^[a-zA-Z_][a-zA-Z0-9_-]*/,
    DOTS: /^(?:\.{2,}(?=\.[a-zA-Z_*])|\.+(?![a-zA-Z_*]))/, // либо (...), либо (..)(.foo) -- то есть если после точек есть идентификатор, то последнюю точку не берем.
    ESC: /^["'\\nt]/,
    NUMBER: /^[0-9]+(\.[0-9]+)?/,
    EOL: /^\s*(\/\/.*)?$/,
    '/': /^\/(?!\/)/,
    '|': /^\|(?!\|)/,
    '=': /^=(?!=)/,
    '{': /^{(?!{)/,
    '}': /^}(?!})/
};


// ----------------------------------------------------------------------------------------------------------------- //

// Keywords

Yate.Grammar.keywords = [
    'match',
    'func',
    'for',
    'if',
    'else',
    'apply',
    'key',
    'nodeset',
    'boolean',
    'scalar'
];


// ----------------------------------------------------------------------------------------------------------------- //

// Rules

Yate.Grammar.rules = {};


// ----------------------------------------------------------------------------------------------------------------- //
// Blocks
// ----------------------------------------------------------------------------------------------------------------- //

// stylesheet := block

Yate.Grammar.rules.stylesheet = {

    rule: function(ast) {
        ast.Block = this.match('block');

        if (!this.isEOF()) {
            this.error('EOF expected');
        }

    },

    options: {
        skipper: 'default_'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// block := ( template | function_ | key | var_ | block_expr )*

Yate.Grammar.rules.block = function(ast) {

    while (!( this.isEOF() || this.testAny([ '}', ']', ')' ]) )) { // Блок верхнего уровня (stylesheet) заканчивается с концом файла.
                                                                   // Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.

        if (this.isEOL()) { // Пропускаем пустые строки.
            this.eol();
            continue;
        }

        var r = null;
        if (this.test('template')) {
            ast.Templates.add( this.match('template') );

        } else if (( r = this.testAny([ 'key', 'function_', 'var_' ]) )) {
            ast.Defs.add( this.match(r) );

        } else {
            ast.Exprs.add( this.match('block_expr') );

        }

        if (!this.isEOL()) { // Если после выражения или определения нет перевода строки, то это конец блока.
            break;
        }
        this.eol();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// body := '{' block '}' | '[' block ']'

Yate.Grammar.rules.body = function(ast) {

    var start = this.testAny([ '{', '[' ]); // Блоки бывают двух видов. Обычные { ... } и со списочным контекстом [ ... ].
                                            // В [ ... ] каждое выражение верхнего уровня генерит отдельный элемент списка.
    if (start) {
        this.match(start);

        ast.Block = this.match('block');
        if (start == '[') {
            ast.AsList = true;
        }

        var end = (start == '{') ? '}' : ']';
        this.match(end);
    } else {
        this.error('Expected { or ['); // FIXME: Кажется, тут нужно использовать this.backtrace().
    }

};


// ----------------------------------------------------------------------------------------------------------------- //
// Declarations: templates, functions, keys, vars
// ----------------------------------------------------------------------------------------------------------------- //

// template := 'match'? ( root | jpath ) template_mode? arglist? body

Yate.Grammar.rules.template = function(ast) {
    if (this.test('MATCH')) {
        this.match('MATCH');
    }
    ast.Selector = this.matchAny([ 'root', 'jpath' ]);
    ast.Mode = this.match('template_mode')
    if (this.test('(')) {
        ast.Args = this.match('arglist');
    }
    ast.Body = this.match('body');
};

// template_mode := '#' QNAME

Yate.Grammar.rules.template_mode = function(ast) {
    if (this.test('#')) {
        this.match('#');
        ast.Value = this.match('QNAME');
    } else {
        ast.Value = '';
    }
};

// arglist := '(' arglist_item ( ',' arglist_item )* ')'

Yate.Grammar.rules.arglist = function(ast) {
    this.match('(');
    if (this.test('arglist_item')) {
        ast.add( this.match('arglist_item') );
        while (this.test(',')) {
            this.match(',');
            ast.add(this.match('arglist_item'));
        }
    }
    this.match(')');
};

// arglist_item := ( 'nodeset', 'boolean', 'scalar' )? QNAME ( '=' inline_expr )?

Yate.Grammar.rules.arglist_item = function(ast) {
    var r;
    if (r = this.testAny([ 'NODESET', 'BOOLEAN', 'SCALAR' ])) { // FIXME: Вынести это в отдельное правило.
        ast.Typedef = this.match(r);
    }
    ast.Name = this.match('QNAME');
    if (this.test('=')) {
        this.match('=');
        ast.Default = this.match('inline_expr');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// function_ := 'func'? QNAME arglist body

Yate.Grammar.rules.function_ = function(ast) {
    if (this.test('FUNC')) {
        this.match('FUNC');
    }
    ast.Name = this.match('QNAME');
    ast.Args = this.match('arglist');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// key := 'key' QNAME '(' inline_expr ',' inline_expr ')' body

Yate.Grammar.rules.key = function(ast) {
    this.match('KEY'); // FIXME: Подумать, нельзя ли отказаться от ключевого слова key.
    ast.Name = this.match('QNAME');
    this.match('(');
    ast.Nodes = this.match('inline_expr');
    this.match(',');
    ast.Use = this.match('inline_expr');
    this.match(')');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// var_ := QNAME '=' block_expr

Yate.Grammar.rules.var_ = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('block_expr');
};


// ----------------------------------------------------------------------------------------------------------------- //
// Block expressions
// ----------------------------------------------------------------------------------------------------------------- //

// block_expr := if_ | for_ | apply | attr | xml_line | array | object | pair | scalar

Yate.Grammar.rules.block_expr = function() {
    var r;

    if (this.test('if_')) {
        r = this.match('if_');
    } else if (this.test('for_')) {
        r = this.match('for_');
    } else if (this.test('apply')) {
        r = this.match('apply');
    } else if (this.test('@')) {
        r = this.match('attr');
    } else if (this.test('<')) {
        r = this.match('xml_line');
    } else if (this.test('[')) {
        r = this.match('array');
    } else if (this.test('{')) {
        r = this.match('object');
    } else if (this.test('pair')) {
        r = this.match('pair');
    } else {
        r = this.match('scalar');
    }

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

// if_ := 'if' inline_expr body ( 'else' body )?

Yate.Grammar.rules.if_ = function(ast) {
    this.match('IF');
    ast.Condition = this.match('inline_expr');
    ast.Then = this.match('body');
    if (this.test('ELSE')) {
        this.match('ELSE');
        ast.Else = this.match('body');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// for_ := 'for' inline_expr body

Yate.Grammar.rules.for_ = function(ast) {
    this.match('FOR');
    ast.Selector = this.match('inline_expr');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// apply := 'apply' ( inline_expr | array | object ) template_mode? callargs?

Yate.Grammar.rules.apply = function(ast) {
    this.match('APPLY');
    var r = this.testAny([ 'inline_expr', 'array', 'object' ]);
    if (!r) {
        this.error('Expected expr');
    }

    ast.Expr = this.match(r);
    ast.Mode = this.match('template_mode');
    if (this.test('(')) {
        ast.Args = this.match('callargs');
    }
};

// callargs := '(' ( inline_expr ( ',' inline_expr )* )? ')'

Yate.Grammar.rules.callargs = function(ast) {
    this.match('(');
    if (this.test('inline_expr')) {
        ast.add( this.match('inline_expr') );
        while (this.test(',')) {
            this.match(',');
            ast.add( this.match('inline_expr') );
        }
    }
    this.match(')');
};

// ----------------------------------------------------------------------------------------------------------------- //

// attr := '@' QNAME ( '=' | '+=' ) block_expr

Yate.Grammar.rules.attr = function(ast) {
    this.match('@');
    ast.Name = this.match('QNAME');
    var r;
    if (r = this.testAny([ '+=', '=' ])) {
        ast.Op = this.match(r);
        ast.Value = this.match('block_expr');
    } else {
        this.error('"=" or "+=" expected');
    }
};


// ----------------------------------------------------------------------------------------------------------------- //

// array := '[' block ']'

Yate.Grammar.rules.array = function(ast) { // FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    this.match('[');
    ast.Block = this.match('block');
    this.match(']');
};


// ----------------------------------------------------------------------------------------------------------------- //

// object := '{' block '}'

Yate.Grammar.rules.object = function(ast) { // FIXME: Поддержать инлайновый вариант: { "foo": 42, "bar": 24 }.
    this.match('{');
    ast.Block = this.match('block');
    this.match('}');
};


// ----------------------------------------------------------------------------------------------------------------- //

// pair := inline_expr ':' block_expr

Yate.Grammar.rules.pair = function(ast) {
    ast.Key = this.match('inline_expr');
    this.match(':');
    ast.Value = this.match('block_expr');
};

// ----------------------------------------------------------------------------------------------------------------- //

// scalar := inline_expr | '(' block ')'

Yate.Grammar.rules.scalar = function(ast) {
    if (this.test('inline_expr')) {
        return this.match('inline_expr');
    } else {
        this.match('(');
        ast.Block = this.match('block');
        this.match(')');
    }
};


// ----------------------------------------------------------------------------------------------------------------- //
// XML
// ----------------------------------------------------------------------------------------------------------------- //

// xml_line := (xml_full | xml_empty | xml_start | xml_end)+

Yate.Grammar.rules.xml_line = {

    rule: function(ast) {
        var r;
        while ((r = this.testAny([ 'xml_full', 'xml_empty', 'xml_start', 'xml_end' ]))) {
            ast.add( this.match(r) );
        }
    },

    options: {
        skipper: 'none'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_full := xml_start ( xml_full | xml_empty | xml_text )* xml_end

Yate.Grammar.rules.xml_full = function(ast) {
    var start = this.match('xml_start');
    ast.add(start);

    var r;
    while ((r = this.testAny([ 'xml_full', 'xml_empty', 'xml_text' ]))) {
        ast.add( this.match(r) );
    }

    var end = this.match('xml_end');
    ast.add(end);

    if (start.Name != end.Name) {
        this.backtrace();
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_start := '<' QNAME ( xml_attrs )? '>'

Yate.Grammar.rules.xml_start = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xml_attrs');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_empty := '<' QNAME ( xml_attrs )? '/>'

Yate.Grammar.rules.xml_empty = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xml_attrs');
    this.match('/>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_end := '</' QNAME '>'

Yate.Grammar.rules.xml_end = function(ast) {
    this.match('</');
    ast.Name = this.match('QNAME');
    this.skip('spaces');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_text := string_content

Yate.Grammar.rules.xml_text = function(ast) {
    var r = this.match('string_content', '<');
    if (r.empty()) {
        this.backtrace();
    }
    ast.Text = r;
};

// ----------------------------------------------------------------------------------------------------------------- //

// xml_attrs := xml_attr*

Yate.Grammar.rules.xml_attrs = {

    rule: function(ast) {
        while (this.test('xml_attr')) {
            ast.add( this.match('xml_attr') );
        }
    },

    options: {
        skipper: 'spaces'
    }

};

// xml_attr := QNAME '=' inline_string

Yate.Grammar.rules.xml_attr = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('inline_string');
};


// ----------------------------------------------------------------------------------------------------------------- //
// Inline expressions
// ----------------------------------------------------------------------------------------------------------------- //

// inline_expr := inline_or

Yate.Grammar.rules.inline_expr = {

    rule: function() {
        return this.match('inline_or');
    },

    options: {
        skipper: 'spaces'
    }

};

// inline_or := inline_and ( '||' inline_or )?

Yate.Grammar.rules.inline_or = function(ast) {
    ast.Left = this.match('inline_and');
    if (this.test('||')) {
        ast.Op = this.match('||');
        ast.Right = this.match('inline_or');
    } else {
        return ast.Left;
    }
};

// inline_and := inline_eq ( '&&' inline_and )?

Yate.Grammar.rules.inline_and = function(ast) {
    ast.Left = this.match('inline_eq');
    if (this.test('&&')) {
        ast.Op = this.match('&&');
        ast.Right = this.match('inline_and');
    } else {
        return ast.Left;
    }
};

// inline_eq := inline_rel ( ( '==' | '!=' ) inline_rel )?

Yate.Grammar.rules.inline_eq = function(ast) {
    ast.Left = this.match('inline_rel');
    var op;
    if (op = this.testAny([ '==', '!=' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_rel');
    } else {
        return ast.Left;
    }
};

// inline_rel := inline_add ( ( '<=' | '<' | '>=' | '>' ) inline_add )?

Yate.Grammar.rules.inline_rel = function(ast) {
    ast.Left = this.match('inline_add');
    var op;
    if (op = this.testAny([ '<=', '<', '>=', '>' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_add');
    } else {
        return ast.Left;
    }
};

// inline_add := inline_scalar ( ( '+' | '-' ) inline_add )?

Yate.Grammar.rules.inline_add = function(ast) {
    ast.Left = this.match('inline_scalar');
    var op;
    if (op = this.testAny([ '+', '-' ])) { // FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
        ast.Op = this.match(op);
        ast.Right = this.match('inline_add');
    } else {
        return ast.Left;
    }
};

// inline_scalar := inline_mul+

Yate.Grammar.rules.inline_scalar = function(ast) {
    ast.add( this.match('inline_mul') );
    while (this.test('inline_mul')) {
        ast.add( this.match('inline_mul') );
    }
};

// inline_mul := inline_unary ( ( '/' | '*' | '%' ) inline_mul )?

Yate.Grammar.rules.inline_mul = function(ast) {
    ast.Left = this.match('inline_unary');
    var op;
    if (op = this.testAny([ '/', '*', '%' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_mul');
    } else {
        return ast.Left;
    }
};

// inline_unary := '-' inline_not | inline_not

Yate.Grammar.rules.inline_unary = function(ast) {
    if (this.test('-')) {
        ast.Op = this.match('-');
        ast.Left = this.match('inline_not');
    } else {
        return this.match('inline_not');
    }
};

// inline_not := '!' inline_union | inline_union

Yate.Grammar.rules.inline_not = function(ast) {
    if (this.test('!')) {
        ast.Op = this.match('!');
        ast.Left = this.match('inline_union');
    } else {
        return this.match('inline_union');
    }
};

// inline_union := inline_primary ( '|' inline_union )?

Yate.Grammar.rules.inline_union = function(ast) {
    ast.Left = this.match('inline_primary');
    if (this.test('|')) {
        ast.Op = this.match('|');
        ast.Right = this.match('inline_union');
    } else {
        return ast.Left;
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_primary := inline_number | inline_string | inline_complex | root | jpath | inline_function | inline_var

Yate.Grammar.rules.inline_primary = {

    rule: function(ast) {
        if (this.test('NUMBER')) {
            return this.match('inline_number');
        }

        if (this.test('"')) {
            return this.match('inline_string');
        }

        var expr;

        if (this.test('(')) {
            expr = this.match('inline_complex');
        } else if (this.test('/')) {
            expr = this.match('root');
        } else if (this.test('.')) {
            expr = this.match('jpath');
        } else if (this.test('inline_function')) {
            expr = this.match('inline_function');
        } else if (this.test('inline_var')) {
            expr = this.match('inline_var');
        } else {
            this.error('number, string, jpath, variable or function call expected');
        }

        if (this.test('[')) {
            expr = Yate.AST.make('jpath_filter', expr, this.match('jpath_predicates'));
        }

        if (this.test('.')) {
            expr = Yate.AST.make('jpath_context', expr, this.match('jpath'));
        }

        return expr;
    },

    options: {
        skipper: 'none'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// root := '/'

Yate.Grammar.rules.root = function(ast) {
    this.match('/');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_number := NUMBER

Yate.Grammar.rules.inline_number = function(ast) {
    ast.Value = parseFloat( this.match('NUMBER') );
};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_string := '"' string_content '"'

Yate.Grammar.rules.inline_string = {

    rule: function(ast) {
        this.match('"');
        ast.Value = this.match('string_content', '"', true);
        this.match('"');
    },

    options: {
        skipper: 'none'
    }

};

// string_content := ...

Yate.Grammar.rules.string_content = function(ast, delim, esc) { // Второй параметр задает символ, ограничивающий строковый контент.
                                                                // Третий параметр означает, что нужно учитывать esc-последовательности типа \n, \t и т.д.
    var s = '';

    while (this.current() && !this.test(delim)) {
        if (this.test('{{')) {
            this.match('{{');
            s += '{';
        } else if (this.test('}}')) {
            this.match('}}');
            s += '}';

        } else if (this.test('{')) {
            if (s) {
                ast.add( Yate.AST.make('string_literal', s) );
                s = '';
            }
            this.match('{');
            this.skip('spaces');
            ast.add( Yate.AST.make('string_expr', this.match('inline_expr')) );
            this.skip('spaces');
            this.match('}');

        } else if (esc && this.test('\\')) {
            this.match('\\');
            if (this.test('ESC')) {
                var c = this.match('ESC');
                switch (c) {
                    case 'n': s += '\n'; break;
                    case 't': s += '\t'; break;
                    default: s += c;
                }
            }

        } else {
            s += this.current(1);
            this.next(1);
        }
    }

    if (s) {
        ast.add( Yate.AST.make('string_literal', s) );
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_complex := '(' inline_expr ')'

Yate.Grammar.rules.inline_complex = {

    rule: function(ast) {
        this.match('(');
        ast.Expr = this.match('inline_expr');
        this.match(')');
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_var := QNAME

Yate.Grammar.rules.inline_var = function(ast) {
    ast.Name = this.match('QNAME');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inline_function := QNAME callargs

Yate.Grammar.rules.inline_function = function(ast) {
    ast.Name = this.match('QNAME');
    ast.Args = this.match('callargs');
};


// ----------------------------------------------------------------------------------------------------------------- //
// JPath
// ----------------------------------------------------------------------------------------------------------------- //

// jpath := jpath_steps

Yate.Grammar.rules.jpath = {

    rule: function(ast) {
        ast.Steps = this.match('jpath_steps'); // FIXME: Зачем нужен этот промежуточное правило? Потому что items.js() не ходит в шаблоны,
                                               //        а просто склеивает item.js().
    },

    options: {
        skipper: 'none'
    }

};

// jpath_steps := jpath_step+

Yate.Grammar.rules.jpath_steps = function(ast) {
    ast.add( this.match('jpath_step') );
    while (this.test('jpath_step')) {
        ast.add( this.match('jpath_step') );
    }
};

// jpath_step := jpath_dots | jpath_nametest

Yate.Grammar.rules.jpath_step = function() {
    return this.matchAny([ 'jpath_dots', 'jpath_nametest' ]);
};

// jpath_parents := '.'+

Yate.Grammar.rules.jpath_dots = function(ast) {
    ast.Dots = this.match('DOTS');
};

// jpath_nametest := '.' ( QNAME | '*' ) jpath_predicates?

Yate.Grammar.rules.jpath_nametest = function(ast) {
    this.match('.');
    ast.Name = this.matchAny([ 'QNAME', '*' ]);
    if (this.test('[')) {
        ast.Predicates = this.match('jpath_predicates');
    }
};

// jpath_predicates := jpath_predicate+

Yate.Grammar.rules.jpath_predicates = function(ast) {
    while (this.test('[')) {
        ast.add( this.match('jpath_predicate') );
    }
};

// jpath_predicate := '[' inline_expr ']'

Yate.Grammar.rules.jpath_predicate = {

    rule: function(ast) {
        this.match('[');
        ast.Expr = this.match('inline_expr');
        this.match(']');
    },

    options: {
        skipper: 'spaces'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //
// Skippers
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Grammar.skippers = {};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Grammar.skippers.default_ = function() {
    var r = false;
    while (1) {
        var l = this.skip('spaces') || this.skip('blockComments');
        r = r || l;
        if (!l) { break; }
    }
    return r;
};

Yate.Grammar.skippers.spaces = /^\ +/;

Yate.Grammar.skippers.none = function() {};

Yate.Grammar.skippers.blockComments = function() {
    if (this.isEOF()) { return; }

    if (this.current(2) != '/*') { return; }

    this.next(2);
    while (!this.isEOF()) {
        var i = this.current().indexOf('*/');
        if (i == -1) {
            this.nextLine();
        } else {
            this.next(i);
            break;
        }
    }
    if (this.current(2) != '*/') {
        this.error('Expected */');
    }
    this.next(2);

    return true;
};

// ----------------------------------------------------------------------------------------------------------------- //

