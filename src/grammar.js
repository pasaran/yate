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

            apply [ 1, 2, 3 ]

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

// stylesheet = block

Yate.Grammar.rules.stylesheet = {

    rule: function(ast) {
        ast.Body = this.match('block');

        if (!this.isEOF()) {
            this.error('EOF expected');
        }

    },

    options: {
        skipper: 'default_'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// block = ( template | function_ | key | var_ | blockExpr )*

Yate.Grammar.rules.block = function(ast) {

    while (!( this.isEOF() || this.testAny([ '}', ']', ')' ]) )) { // Блок верхнего уровня (stylesheet) заканчивается с концом файла.
                                                                   // Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.

        if (this.isEOL()) { // Пропускаем пустые строки.
            this.eol();
            continue;
        }

        if (this.test('MATCH')) {
            ast.Templates.add( this.match('template') );
        } else if (this.test('FUNC')) {
            ast.Defs.add( this.match('function_') );
        } else if (this.test('KEY')) {
            ast.Defs.add( this.match('key') );
        } else if (this.testAll([ 'QNAME', '=' ])) {
            ast.Defs.add( this.match('var_') );
        } else {
            ast.Exprs.add( this.match('blockExpr') );
        }

        if (!this.isEOL()) { // Если после выражения или определения нет перевода строки, то это конец блока.
            break;
        }
        this.eol();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// body = '{' block '}' | '[' block ']'

Yate.Grammar.rules.body = function() {

    var start = this.testAny([ '{', '[' ]); // Блоки бывают двух видов. Обычные { ... } и со списочным контекстом [ ... ].
                                            // В [ ... ] каждое выражение верхнего уровня генерит отдельный элемент списка.
    if (start) {
        this.match(start);

        var block = this.match('block');
        if (start == '[') {
            block.AsList = true;
        }

        var end = (start == '{') ? '}' : ']';
        this.match(end);

        return block;
    } else {
        this.error('Expected { or [');
    }

};


// ----------------------------------------------------------------------------------------------------------------- //
// Declarations: templates, functions, keys, vars
// ----------------------------------------------------------------------------------------------------------------- //

// template = 'match' jpath templateMode? argList? body

Yate.Grammar.rules.template = function(ast) {
    this.match('MATCH');
    ast.Jpath = this.match('jpath');
    ast.Mode = this.match('templateMode')
    if (this.test('(')) {
        ast.Args = this.match('argList');
    }
    ast.Body = this.match('body');
};

// templateMode = ':' QNAME

Yate.Grammar.rules.templateMode = function(ast) {
    if (this.test(':')) {
        this.match(':');
        ast.Value = this.match('QNAME');
    } else {
        ast.Value = '';
    }
};

// argList = '(' argListItem ( ',' argListItem )* ')'

Yate.Grammar.rules.argList = function(ast) {
    this.match('(');
    if (this.test('argListItem')) {
        ast.add( this.match('argListItem') );
        while (this.test(',')) {
            this.match(',');
            ast.add(this.match('argListItem'));
        }
    }
    this.match(')');
};

// argListItem = ( 'nodeset', 'boolean', 'scalar' )? QNAME ( '=' inlineScalar )?

Yate.Grammar.rules.argListItem = function(ast) {
    var r;
    if (r = this.testAny([ 'NODESET', 'BOOLEAN', 'SCALAR' ])) {
        ast.Typedef = this.match(r);
    }
    ast.Name = this.match('QNAME');
    if (this.test('=')) {
        this.match('=');
        ast.Default = this.match('inlineScalar');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// function_ = 'func' QNAME argList body

Yate.Grammar.rules.function_ = function(ast) {
    this.match('FUNC');
    var name = ast.Name = this.match('QNAME');
    ast.Args = this.match('argList');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// key = 'key' QNAME '(' inlineScalar ',' inlineScalar ')' body

Yate.Grammar.rules.key = function(ast) {
    this.match('KEY');
    ast.Name = this.match('QNAME');
    this.match('(');
    ast.Nodes = this.match('inlineScalar');
    this.match(',');
    ast.Use = this.match('inlineScalar');
    this.match(')');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// var_ = QNAME '=' blockExpr

Yate.Grammar.rules.var_ = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('blockExpr');
};


// ----------------------------------------------------------------------------------------------------------------- //
// Block expressions
// ----------------------------------------------------------------------------------------------------------------- //

// blockExpr = if_ | for_ | apply | attr | xmlLine | array | object | pair | scalar

Yate.Grammar.rules.blockExpr = function() {
    var r;

    if (this.test('IF')) {
        r = this.match('if_');
    } else if (this.test('FOR')) {
        r = this.match('for_');
    } else if (this.test('APPLY')) {
        r = this.match('apply');
    } else if (this.test('@')) {
        r = this.match('attr');
    } else if (this.test('<')) {
        r = this.match('xmlLine');
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

// if_ = 'if' inlineExpr body ( 'else' body )?

Yate.Grammar.rules.if_ = function(ast) {
    this.match('IF');
    ast.Condition = this.match('inlineExpr');
    ast.Then = this.match('body');
    if (this.test('ELSE')) {
        this.match('ELSE');
        ast.Else = this.match('body');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// for_ = 'for' inlineExpr body

Yate.Grammar.rules.for_ = function(ast) {
    this.match('FOR');
    ast.Expr = this.match('inlineExpr');
    ast.Body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// apply = 'apply' ( inlineExpr | array | object ) templateMode? ( callArgs )?

Yate.Grammar.rules.apply = function(ast) {
    this.match('APPLY');
    var r = this.testAny([ 'inlineExpr', 'array', 'object' ]);
    if (!r) {
        this.error('Expected expr');
    }

    ast.Expr = this.match(r);
    ast.Mode = this.match('templateMode');
    if (this.test('(')) {
        ast.Args = this.match('callArgs');
    }
};

// callArgs =( inlineScalar ( ',' inlineScalar )* )?

Yate.Grammar.rules.callArgs = function(ast) {
    this.match('(');
    if (this.test('inlineScalar')) {
        ast.add( this.match('inlineScalar') );
        while (this.test(',')) {
            this.match(',');
            ast.add( this.match('inlineScalar') );
        }
    }
    this.match(')');
};

// ----------------------------------------------------------------------------------------------------------------- //

// attr = '@' QNAME ( '=' | '+=' ) blockExpr

Yate.Grammar.rules.attr = function(ast) {
    this.match('@');
    ast.Name = this.match('QNAME');
    var r;
    if (r = this.testAny([ '+=', '=' ])) {
        ast.Op = this.match(r);
        ast.Expr = this.match('blockExpr');
    } else {
        this.error('"=" or "+=" expected');
    }
};


// ----------------------------------------------------------------------------------------------------------------- //

// array = '[' block ']'

Yate.Grammar.rules.array = function(ast) { // FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    this.match('[');
    ast.Body = this.match('block');
    this.match(']');
};


// ----------------------------------------------------------------------------------------------------------------- //

// object = '{' block '}'

Yate.Grammar.rules.object = function(ast) { // FIXME: Поддержать инлайновый вариант: { "foo": 42 }.
    this.match('{');
    ast.Body = this.match('block');
    this.match('}');
};


// ----------------------------------------------------------------------------------------------------------------- //

// pair = inlineScalar ':' blockExpr

Yate.Grammar.rules.pair = function(ast) {
    ast.Key = this.match('inlineScalar');
    this.match(':');
    ast.Value = this.match('blockExpr');
};

// ----------------------------------------------------------------------------------------------------------------- //

// scalar = inlineScalar | '(' block ')'

Yate.Grammar.rules.scalar = function(ast) {
    if (this.test('inlineScalar')) {
        return this.match('inlineScalar');
    } else {
        this.match('(');
        ast.Body = this.match('block');
        this.match(')');
    }
};


// ----------------------------------------------------------------------------------------------------------------- //
// XML
// ----------------------------------------------------------------------------------------------------------------- //

// xmlLine = (xmlFull | xmlEmpty | xmlStart | xmlEnd)+

Yate.Grammar.rules.xmlLine = {

    rule: function(ast) {
        var r;
        while ((r = this.testAny([ 'xmlFull', 'xmlEmpty', 'xmlStart', 'xmlEnd' ]))) {
            ast.add( this.match(r) );
        }
    },

    options: {
        skipper: 'none'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlFull = xmlStart ( xmlFull | xmlEmpty | xmlText )* xmlEnd

Yate.Grammar.rules.xmlFull = function(ast) {
    var start = this.match('xmlStart');
    ast.add(start);

    var r;
    while ((r = this.testAny([ 'xmlFull', 'xmlEmpty', 'xmlText' ]))) {
        ast.add( this.match(r) );
    }

    var end = this.match('xmlEnd');
    ast.add(end);

    if (start.Name != end.Name) {
        this.backtrace();
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlStart = '<' QNAME ( xmlAttrs )? '>'

Yate.Grammar.rules.xmlStart = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xmlAttrs');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlEmpty = '<' QNAME ( xmlAttrs )? '/>'

Yate.Grammar.rules.xmlEmpty = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xmlAttrs');
    this.match('/>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlEnd = '</' QNAME '>'

Yate.Grammar.rules.xmlEnd = function(ast) {
    this.match('</');
    ast.Name = this.match('QNAME');
    this.skip('spaces');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlText = stringContent

Yate.Grammar.rules.xmlText = function(ast) {
    var r = this.match('stringContent', '<');
    if (r.empty()) {
        this.backtrace();
    }
    ast.Text = r;
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlAttrs = xmlAttr*

Yate.Grammar.rules.xmlAttrs = {

    rule: function(ast) {
        while (this.test('xmlAttr')) {
            ast.add( this.match('xmlAttr') );
        }
    },

    options: {
        skipper: 'spaces'
    }

};

// xmlAttr = QNAME '=' inlineString

Yate.Grammar.rules.xmlAttr = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('inlineString');
};


// ----------------------------------------------------------------------------------------------------------------- //
// inlineScalar values
// ----------------------------------------------------------------------------------------------------------------- //

// inlineScalar = inlineExpr+

Yate.Grammar.rules.inlineScalar = { // FIXME: Кажется, нужно поменять местами inlineExpr и inlineScalar.

    rule: function(ast) {
        ast.add( this.match('inlineExpr') );
        while (this.test('inlineExpr')) {
            ast.add( this.match('inlineExpr') );
        }
    },

    options: {
        skipper: 'spaces'
    }

};


// ----------------------------------------------------------------------------------------------------------------- //
// Inline expressions
// ----------------------------------------------------------------------------------------------------------------- //

// inlineExpr = inlineOr

Yate.Grammar.rules.inlineExpr = {

    rule: function() {
        return this.match('inlineOr');
    },

    options: {
        skipper: 'spaces'
    }

};

// inlineOr = inlineAnd ( '||' inlineOr )?

Yate.Grammar.rules.inlineOr = function(ast) {
    ast.Left = this.match('inlineAnd');
    if (this.test('||')) {
        ast.Op = this.match('||');
        ast.Right = this.match('inlineOr');
    } else {
        return ast.Left;
    }
};

// inlineAnd = inlineEq ( '&&' inlineAnd )?

Yate.Grammar.rules.inlineAnd = function(ast) {
    ast.Left = this.match('inlineEq');
    if (this.test('&&')) {
        ast.Op = this.match('&&');
        ast.Right = this.match('inlineAnd');
    } else {
        return ast.Left;
    }
};

// inlineEq = inlineRel ( ( '==' | '!=' ) inlineRel )?

Yate.Grammar.rules.inlineEq = function(ast) {
    ast.Left = this.match('inlineRel');
    var op;
    if (op = this.testAny([ '==', '!=' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inlineRel');
    } else {
        return ast.Left;
    }
};

// inlineRel = inlineAdd ( ( '<=' | '<' | '>=' | '>' ) inlineAdd )?

Yate.Grammar.rules.inlineRel = function(ast) {
    ast.Left = this.match('inlineAdd');
    var op;
    if (op = this.testAny([ '<=', '<', '>=', '>' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inlineAdd');
    } else {
        return ast.Left;
    }
};

// inlineAdd = inlineMul ( ( '+' | '-' ) inlineAdd )?

Yate.Grammar.rules.inlineAdd = function(ast) {
    ast.Left = this.match('inlineMul');
    var op;
    if (op = this.testAny([ '+', '-' ])) { // FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
        ast.Op = this.match(op);
        ast.Right = this.match('inlineAdd');
    } else {
        return ast.Left;
    }
};

// inlineMul = inlineUnary ( ( '/' | '*' | '%' ) inlineMul )?

Yate.Grammar.rules.inlineMul = function(ast) {
    ast.Left = this.match('inlineUnary');
    var op;
    if (op = this.testAny([ '/', '*', '%' ])) {
        ast.Op = this.match(op);
        ast.Right = this.match('inlineMul');
    } else {
        return ast.Left;
    }
};

// inlineUnary = '-' inlineNot | inlineNot

Yate.Grammar.rules.inlineUnary = function(ast) {
    if (this.test('-')) {
        ast.Op = this.match('-');
        ast.Left = this.match('inlineNot');
    } else {
        return this.match('inlineNot');
    }
};

// inlineNot = '!' inlineUnion | inlineUnion

Yate.Grammar.rules.inlineNot = function(ast) {
    if (this.test('!')) {
        ast.Op = this.match('!');
        ast.Left = this.match('inlineUnion');
    } else {
        return this.match('inlineUnion');
    }
};

// inlineUnion = inlinePrimary ( '|' inlineUnion )?

Yate.Grammar.rules.inlineUnion = function(ast) {
    ast.Left = this.match('inlinePrimary');
    if (this.test('|')) {
        ast.Op = this.match('|');
        ast.Right = this.match('inlineUnion');
    } else {
        return ast.Left;
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlinePrimary = inlineNumber | inlineString | inlineComplex | inlineRoot | jpath | inlineFunction | inlineVar

Yate.Grammar.rules.inlinePrimary = {

    rule: function(ast) {
        if (this.test('NUMBER')) {
            return this.match('inlineNumber');
        }

        if (this.test('"')) {
            return this.match('inlineString');
        }

        var expr;

        if (this.test('(')) {
            expr = this.match('inlineComplex');
        } else if (this.test('/')) {
            expr = this.match('inlineRoot');
        } else if (this.test('.')) {
            expr = this.match('jpath');
        } else if (this.test('inlineFunction')) {
            expr = this.match('inlineFunction');
        } else if (this.test('inlineVar')) {
            expr = this.match('inlineVar');
        } else {
            this.error('number, string, jpath, variable or function call expected');
        }

        if (this.test('[')) {
            expr = Yate.AST.make('inlineGrep', expr, this.match('jpath_predicates'));
        }

        if (this.test('.')) {
            var jpath = this.match('jpath');
            jpath.Context = expr;
            jpath.Absolute = false;

            expr = jpath;
        }

        return expr;
    },

    options: {
        skipper: 'none'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineRoot = '/'

Yate.Grammar.rules.inlineRoot = function(ast) {
    this.match('/');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineNumber = NUMBER

Yate.Grammar.rules.inlineNumber = function(ast) {
    ast.Value = parseFloat( this.match('NUMBER') );
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Grammar.rules.inlineString = {

    rule: function(ast) {
        this.match('"');
        ast.Value = this.match('stringContent', '"', true);
        this.match('"');
    },

    options: {
        skipper: 'none'
    }

};

Yate.Grammar.rules.stringContent = function(ast, delim, esc) { // Второй параметр задает символ, ограничивающий строковый контент.
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
                ast.add( Yate.AST.make('stringLiteral', s) );
                s = '';
            }
            this.match('{');
            this.skip('spaces');
            ast.add( Yate.AST.make('stringExpr', this.match('inlineScalar')) );
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
        ast.add( Yate.AST.make('stringLiteral', s) );
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineComplex = '(' inlineScalar ')'

Yate.Grammar.rules.inlineComplex = {

    rule: function(ast) {
        this.match('(');
        ast.Expr = this.match('inlineScalar');
        this.match(')');
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineVar = QNAME

Yate.Grammar.rules.inlineVar = function(ast) {
    ast.Name = this.match('QNAME');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineFunction = QNAME callArgs

Yate.Grammar.rules.inlineFunction = function(ast) {
    ast.Name = this.match('QNAME');
    ast.Args = this.match('callArgs');
};


// ----------------------------------------------------------------------------------------------------------------- //
// JPath
// ----------------------------------------------------------------------------------------------------------------- //

// jpath = jpath_steps

Yate.Grammar.rules.jpath = {

    rule: function(ast) {
        ast.Steps = this.match('jpath_steps'); // FIXME: Переименовать jpath_steps в jpath.
    },

    options: {
        skipper: 'none'
    }

};

// jpath_steps = ( jpath_dots | jpath_nametest )*

Yate.Grammar.rules.jpath_steps = function(ast) {
    var r;
    ast.add( this.match('jpath_step') );
    while (this.test('jpath_step')) {
        ast.add( this.match('jpath_step') );
    }
};

Yate.Grammar.rules.jpath_step = function() {
    if (this.test('DOTS')) {
        return this.match('jpath_dots');
    } else {
        return this.match('jpath_nametest');
    }
};

// jpath_parents = '.'+

Yate.Grammar.rules.jpath_dots = function(ast) {
    ast.Dots = this.match('DOTS');
};

// jpath_nametest = '.' ( QNAME | '*' ) jpath_predicates?

Yate.Grammar.rules.jpath_nametest = function(ast) {
    this.match('.');

    var nametest = this.testAny([ 'QNAME', '*' ]);
    ast.Name = this.match(nametest); // FIXME: А почему еще нет matchAny?

    if (this.test('[')) {
        ast.Predicates = this.match('jpath_predicates');
    }
};

// jpath_predicates = jpath_predicate+

Yate.Grammar.rules.jpath_predicates = function(ast) {
    while (this.test('[')) {
        ast.add( this.match('jpath_predicate') );
    }
};

// jpath_predicate = '[' inlineScalar ']'

Yate.Grammar.rules.jpath_predicate = {

    rule: function(ast) {
        this.match('[');
        ast.Expr = this.match('inlineScalar'); // FIXME: Почему не inlineExpr?
        this.match(']');
    },

    options: {
        skipper: 'spaces'
    }

};

/*
Yate.Grammar.rules.jpath_grep = function(ast) {
    // TODO
};
*/

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

