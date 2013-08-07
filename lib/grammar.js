var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var yate = require('./yate.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  yate grammar
//  ---------------------------------------------------------------------------------------------------------------  //

grammar = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Tokens

grammar.tokens = {
    QNAME: /^[a-zA-Z_][a-zA-Z0-9_-]*/,
    JSTEP: /^[a-zA-Z0-9_][a-zA-Z0-9_-]*/,
    //  либо (...), либо (..)(.foo) -- то есть если после точек есть идентификатор, то последнюю точку не берем.
    DOTS: /^(?:\.{2,}(?=\.[a-zA-Z0-9_*])|\.+(?![a-zA-Z0-9_*]))/,
    ESC: /^["'\\nt]/,
    NUMBER: /^[0-9]+(\.[0-9]+)?/,
    '/': /^\/(?!\/)/,
    '|': /^\|(?!\|)/,
    '=': /^=(?!=)/,
    ATTR_END: /^(?:\s+|\+=|=)/
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  Keywords

grammar.keywords = [
    'module',
    'import',
    'include',
    'match',
    'func',
    'external',
    'sort',
    'for',
    'if',
    'else',
    'else if',
    'apply',
    'key',
    'nodeset',
    'boolean',
    'scalar',
    'attr',
    'xml',
    'asc',
    'desc',
    'object',
    'array'
];


//  ---------------------------------------------------------------------------------------------------------------  //

//  Rules

var rules = grammar.rules = {};

rules.eol = function(parser) {
    if ( !parser.is_eol() ) {
        parser.error('EOL expected');
    }
    parser.nextLine();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Blocks
//  ---------------------------------------------------------------------------------------------------------------  //

//  module := ('module' inline_string EOL)? block

rules.module = {

    rule: function(parser, ast) {
        while ( parser.is_eol() ) {
            parser.nextLine();
        }

        if ( parser.test('MODULE') ) {
            ast.Name = parser.match('module_name');
        }

        ast.Block = parser.match( 'block', { toplevel: true } );

        parser.eof();
    },

    options: {
        skipper: 'default_'
    }

};

rules.module_name = function(parser, ast) {
    parser.match('MODULE');

    ast.Name = parser.match( 'inline_string', { noexpr: true } ).asString();

    parser.eol();
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  block := ( import | include | template | function_ | key | var_ | block_expr )*

rules.block = function(parser, ast, params) {
    //  Блок верхнего уровня (module) заканчивается с концом файла.
    //  Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.
    while ( !( parser.is_eof() || parser.test('}') || parser.test(']') || parser.test(')') ) ) {
        //  Пропускаем пустые строки.
        if ( parser.is_eol() ) {
            parser.eol();
            continue;
        }

        var r;
        if (params.toplevel) {
            if ( parser.test('IMPORT') ) {
                r = parser.match('import');

            } else if ( parser.test('MATCH') ) {
                r = parser.match('template');

            } else if ( parser.test('KEY') ) {
                r = parser.match('key');

            } else if ( parser.test('EXTERNAL') ) {
                r = parser.match('external');

            }
        }

        if ( parser.test('FUNC') ) {
            r = parser.match('function_');

        } else if ( parser.test('INCLUDE') ) {
            r = parser.match('include');

        } else if ( parser.testAll('QNAME', '=') ) {
            r = parser.match('var_');

        } else {
            r = parser.match('block_expr');

        }

        ast.add(r);

        //  Если после выражения или определения нет перевода строки, то это конец блока.
        if ( !parser.is_eol() ) {
            break;
        }

        parser.eol();
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  body := '{' block '}'

rules.body = function(parser, ast) {
    parser.match('{');
    ast.Block = parser.match('block');
    parser.match('}');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  import := 'import' inline_string

rules.import = function(parser, ast) {
    parser.match('IMPORT');

    ast.Name = parser.match( 'inline_string', { noexpr: true } ).asString();
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  include := 'include' inline_string

rules.include = function(parser, ast) {
    parser.match('INCLUDE');

    var filename = parser.match( 'inline_string', { noexpr: true } ).asString();
    var dirname = path_.dirname(parser.filename);

    ast.Filename = path_.resolve(dirname, filename);
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Declarations: templates, functions, keys, vars
//  ---------------------------------------------------------------------------------------------------------------  //

//  template := 'match' jpath ( '|' jpath )* template_mode? arglist? body

rules.template = function(parser, ast) {
    parser.match('MATCH');
    ast.Selectors = parser.match('template_selectors');

    ast.Mode = parser.match('template_mode');
    if ( parser.test('(') ) {
        ast.Args = parser.match('arglist');
    }
    ast.Body = parser.match('body');
};

//  template_selectors := jpath ( '|' jpath )*

rules.template_selectors = function(parser, ast) {
    ast.add( parser.match('jpath') );
    while ( parser.test('|') ) {
        parser.match('|');
        ast.add( parser.match('jpath') );
    }
};

//  template_mode := QNAME

rules.template_mode = function(parser, ast) {
    if ( parser.test('QNAME') ) {
        ast.Value = parser.match('QNAME');
    } else {
        ast.Value = '';
    }
};

//  arglist := '(' arglist_item ( ',' arglist_item )* ')'

rules.arglist = function(parser, ast) {
    parser.match('(');
    if ( !parser.test(')') ) {
        ast.add( parser.match('arglist_item') );
        while ( parser.test(',') ) {
            parser.match(',');
            ast.add( parser.match('arglist_item') );
        }
    }
    parser.match(')');
};

//  arglist_item := ( 'nodeset', 'boolean', 'scalar', 'attr', 'xml', 'object', 'array' )? QNAME ( '=' inline_expr )?

rules.arglist_item = function(parser, ast) {
    var r;
    if (( r = test_typedef(parser) )) {
        ast.Typedef = parser.match(r);
    }

    ast.Name = parser.match('QNAME');
    if ( parser.test('=') ) {
        parser.match('=');
        ast.Default = parser.match('inline_expr');
    }
};

function test_typedef(parser) {
    return (
        parser.test('NODESET') ||
        parser.test('BOOLEAN') ||
        parser.test('SCALAR') ||
        parser.test('ATTR') ||
        parser.test('XML') ||
        parser.test('OBJECT') ||
        parser.test('ARRAY')
    );
}

function match_typedef(parser) {
    var r = test_typedef(parser);

    if (!r) {
        parser.error('Typedef required');
    }

    return parser.match(r);
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  function_ := 'func' QNAME arglist body

rules.function_ = function(parser, ast) {
    parser.match('FUNC');
    ast.Name = parser.match('QNAME');
    ast.Args = parser.match('arglist');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  external := 'external' typedef QNAME argtypes

rules.external = function(parser, ast) {
    parser.match('EXTERNAL');
    p.Type = match_typedef(parser);
    p.Name = parser.match('QNAME');
    //  FIXME: А почему это не Items?
    p.ArgTypes = parser.match('argtypes');
};

// argtypes := '(' ( typedef ( ',' typedef )* )? ')'

rules.argtypes = function() {
    var types = [];

    parser.match('(');
    if ( !parser.test(')') ) {
        //  FIXME: Сделать не массив, а items.
        types.push( match_typedef(parser) );
        while ( parser.test(',') ) {
            parser.match(',');
            types.push( parser.match('typedef') );
        }
    }
    parser.match(')');

    return types;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  key := 'key' QNAME '(' inline_expr ',' inline_expr ')' body

rules.key = function(parser, ast) {
    parser.match('KEY');
    p.Name = parser.match('QNAME');
    parser.match('(');
    p.Nodes = parser.match('inline_expr');
    parser.match(',');
    p.Use = parser.match('inline_expr');
    parser.match(')');
    p.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  var_ := QNAME '=' block_expr

rules.var_ = function(parser, ast) {
    p.Name = parser.match('QNAME');
    parser.match('=');
    p.Value = parser.match('block_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Block expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  block_expr := if_ | for_ | apply | attr | xml_line | array | object | pair | subexpr

rules.block_expr = function() {
    var r;

    if ( parser.test('IF') ) {
        r = parser.match('if_');
    } else if ( parser.test('FOR') ) {
        r = parser.match('for_');
    } else if ( parser.test('APPLY') ) {
        r = parser.match('apply');
    } else if ( parser.test(':::') ) {
        r = parser.match('cdata');
    } else if ( parser.test('@') ) {
        r = parser.match('attr');
    } else if ( parser.test('<') ) {
        r = parser.match('xml_line');
    } else if ( parser.test('[') ) {
        r = parser.match('array');
    } else if ( parser.test('{') ) {
        r = parser.match('object');
    } else if ( parser.test('"') || parser.test("'") ) {
        //  Ручной lookahead.
        //  В этом месте может быть либо inline_expr, либо же pair.
        //  Увы, длина в токенах inline_string может быть какой угодно,
        //  так что проверить один-два-эн токенов невозможно.
        //  Поэтому матчим inline_string, смотрим, есть ли за ним двоеточие.
        //  Потом откатываемся назад и матчим уже нужное.

        var state = parser.get_state();

        parser.match('inline_string');
        var is_pair = parser.test(':');

        parser.set_state(state);

        if (is_pair) {
            r = parser.match('pair');
        } else {
            r = parser.match('value');
        }

    } else if ( parser.testAll('(', 'EOL') ) {
        //  В блочном subexpr после скобки должен быть перенос строки.
        //
        //      (
        //          .foo
        //          .bar
        //      )
        //
        //  Но:
        //
        //      ( .foo + .bar )
        //
        r = parser.match('subexpr');

    } else {
        r = parser.match('value');

    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  if_ := 'if' multiline_expr body else_if* else_?

rules.if_ = function(parser, ast) {
    parser.match('IF');
    //  FIXME: Убить эти multiline_expr.
    ast.Condition = parser.match('multiline_expr');
    ast.Then = parser.match('body');
    var Elses = ast.Elses;
    while ( parser.test('ELSE IF') ) {
        Elses.add( parser.match('else_if') );
    }
    if ( parser.test('ELSE') ) {
        Elses.add( parser.match('else_') );
    }
};

//  else_if := 'else if' multiline_expr body

rules.else_if = function(parser, ast) {
    parser.match('ELSE IF');
    ast.Condition = parser.match('multiline_expr');
    ast.Body = parser.match('body');
};

//  else_ := 'else' body

rules.else_ = function(parser, ast) {
    parser.match('ELSE');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  for_ := 'for' multiline_expr body

rules.for_ = function(parser, ast) {
    parser.match('FOR');
    ast.Selector = parser.match('multiline_expr');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  apply := 'apply' ( inline_expr | array | object ) template_mode? callargs?

rules.apply = function(parser, ast) {
    parser.match('APPLY');

    if ( parser.test('{') ) {
        ast.Expr = parser.match('object');
    } else if ( parser.test('[') ) {
        ast.Expr = parser.match('array');
    } else {
        ast.Expr = parser.match('inline_expr');
    }
    /*
    var r = parser.testAny('inline_expr', 'array', 'object');
    if (!r) {
        parser.error('Expected expr');
    }

    p.Expr = parser.match(r);
    */

    ast.Mode = parser.match('template_mode');
    if ( parser.test('(') ) {
        ast.Args = parser.match('callargs');
    }
};

//  callargs := '(' ( callarg ( ',' callarg )* )? ')'

rules.callargs = function(parser, ast) {
    parser.match('(');
    if ( !parser.test(')') ) {
        ast.add( parser.match('callarg') );
        while ( parser.test(',') ) {
            parser.match(',');
            ast.add( parser.match('callarg') );
        }
    }
    parser.match(')');
};

//  callarg := object | array | multiline_expr

rules.callarg = {
    rule: function(parser, ast) {
        if ( parser.test('{') ) {
            ast.Expr = parser.match('object');
        } else if ( parser.test('[') ) {
            ast.Expr = parser.match('array');
        } else {
            ast.Expr = parser.match('multiline_expr');
        }
    },

    options: {
        skipper: 'spaces'
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  attr := '@' QNAME ( '=' | '+=' ) block_expr

rules.attr = function(parser, ast) {
    parser.match('@');

    ast.Name = parser.match('string_content', { noesc: true, delim: 'ATTR_END' });

    var r;
    //  FIXME: matchAny?
    if (( r = parser.testAny('+=', '=') )) {
        ast.Op = parser.match(r);
        ast.Value = parser.match('block_expr');
    } else {
        parser.error('"=" or "+=" expected');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  array := '[' block ']'

rules.array = function(parser, ast) {
    //  FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    parser.match('[');
    ast.Block = parser.match('block');
    parser.match(']');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  object := '{' block '}'

rules.object = function(parser, ast) {
    //  FIXME: Поддержать инлайновый вариант: { "foo": 42, "bar": 24 }.
    parser.match('{');
    ast.Block = parser.match('block');
    parser.match('}');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  pair := inline_expr ':' block_expr

rules.pair = function(parser, ast) {
    ast.Key = parser.match('inline_expr');
    parser.match(':');
    ast.Value = parser.match('block_expr');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' block ')'

rules.subexpr = function(parser, ast) {
    parser.match('(');
    ast.Block = parser.match('block');
    parser.match(')');
};

//  ---------------------------------------------------------------------------------------------------------------  //

rules.value = function(parser, ast) {
    ast.Value = parser.match('inline_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  XML
//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_line := (xml_full | xml_empty | xml_start | xml_end)+

rules.xml_line = {

    rule: function(parser, ast) {
        var r;
        while ( !parser.is_eol() ) {
            if ( parser.test('<') ) {
                ast.add( match_xml_start(parser) );
            } else if ( parser.test('</') ) {
                ast.add( parser.match('xml_end') );
            } else {
                ast.add( parser.match('xml_text') );
            }
        }
    },

    options: {
        skipper: 'none'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_full := xml_start ( xml_full | xml_empty | xml_text )* xml_end

/*
rules.xml_full = {
    rule: function(parser, ast) {
        var start = parser.match('xml_start');
        a.add(start);

        var r;
        while (( r = parser.testAny('xml_full', 'xml_empty', 'xml_text') )) {
            a.add( parser.match(r) );
        }

        var end = parser.match('xml_end');
        a.add(end);

        //  FIXME: Унести это куда-то в .action().
        if (end.p.Name === true) {
            end.p.Name = start.p.Name;
        }

        if (start.p.Name != end.p.Name) {
            parser.backtrace();
        }
    },

    options: {
        skipper: 'htmlBlockComments'
    }
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_start := '<' QNAME ( xml_attrs )? '>'

function match_xml_start(parser) {
    var r = {};

    parser.match('<');
    r.Name = parser.match('QNAME');
    r.Attrs = parser.match('xml_attrs');

    if ( parser.test('>') ) {
        parser.match('>');

        return parser.get_ast('xml_start', r);
    } else {
        parser.match('/>');

        return parser.get_ast('xml_empty', r);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_empty := '<' QNAME ( xml_attrs )? '/>'

/*
rules.xml_empty = function(parser, ast) {
    parser.match('<');
    p.Name = parser.match('QNAME');
    p.Attrs = parser.match('xml_attrs');
    parser.match('/>');
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_end := '</' QNAME '>'

rules.xml_end = function(parser, ast) {
    if ( parser.test('</>') ) {
        parser.match('</>');
        ast.Name = true;
    } else {
        parser.match('</');
        ast.Name = parser.match('QNAME');
        parser.skip('spaces');
        parser.match('>');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_text := string_content

rules.xml_text = function(parser, ast) {
    ast.Text = parser.match( 'string_content', { noesc: true, delim: '<' } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_attrs := xml_attr*

rules.xml_attrs = {

    rule: function(parser, ast) {
        while (1) {
            //  Позволяем перевод строки между xml-атрибутами.
            if ( parser.is_eol() ) {
                parser.eol();
            } else if ( !parser.test('>') && !parser.test('/>') ) {
                ast.add( parser.match('xml_attr') );
            } else {
                break;
            }
        }
    },

    options: {
        skipper: 'spaces'
    }

};

//  xml_attr := QNAME '=' inline_string

rules.xml_attr = function(parser, ast) {
    ast.Name = parser.match('QNAME');
    parser.match('=');
    ast.Value = parser.match('inline_string');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Inline expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_expr := inline_or

rules.inline_expr = {

    rule: function() {
        return parser.match('inline_or');
    },

    options: {
        skipper: 'spaces'
    }

};

//  FIXME: Истребить!
rules.multiline_expr = {

    rule: function() {
        return parser.match('inline_or');
    },

    options: {
        skipper: 'whitespaces'
    }

};

//  inline_or := inline_and ( '||' inline_or )?

rules.inline_or = function(parser, ast) {
    ast.Left = parser.match('inline_and');
    if ( parser.test('||') ) {
        ast.Op = parser.match('||');
        ast.Right = parser.match('inline_or');
    } else {
        return ast.Left;
    }
};

//  inline_and := inline_eq ( '&&' inline_and )?

rules.inline_and = function(parser, ast) {
    ast.Left = parser.match('inline_eq');
    if ( parser.test('&&') ) {
        ast.Op = parser.match('&&');
        ast.Right = parser.match('inline_and');
    } else {
        return ast.Left;
    }
};

//  inline_eq := inline_rel ( ( '==' | '!=' ) inline_rel )?

rules.inline_eq = function(parser, ast) {
    ast.Left = parser.match('inline_rel');
    var op;
    if (( op = parser.testAny('==', '!=') )) {
        ast.Op = parser.match(op);
        ast.Right = parser.match('inline_rel');
    } else {
        return ast.Left;
    }
};

//  inline_rel := inline_add ( ( '<=' | '<' | '>=' | '>' ) inline_add )?

rules.inline_rel = function(parser, ast) {
    ast.Left = parser.match('inline_add');
    var op;
    if (( op = parser.testAny('<=', '<', '>=', '>') )) {
        ast.Op = parser.match(op);
        ast.Right = parser.match('inline_add');
    } else {
        return ast.Left;
    }
};

//  inline_add := inline_mul ( ( '+' | '-' ) inline_add )?

rules.inline_add = function(parser, ast) {
    ast.Left = parser.match('inline_mul');
    var op;
    //  FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
    if (( op = parser.testAny('+', '-') )) {
        ast.Op = parser.match(op);
        ast.Right = parser.match('inline_add');
    } else {
        return ast.Left;
    }
};

//  inline_mul := inline_unary ( ( '/' | '*' | '%' ) inline_mul )?

rules.inline_mul = function(parser, ast) {
    ast.Left = parser.match('inline_unary');
    var op;
    if (( op = parser.testAny('/', '*', '%') )) {
        ast.Op = parser.match(op);
        ast.Right = parser.match('inline_mul');
    } else {
        return ast.Left;
    }
};

//  inline_unary := '-' inline_not | inline_not

rules.inline_unary = function(parser, ast) {
    if ( parser.test('-') ) {
        ast.Op = parser.match('-');
        ast.Left = parser.match('inline_not');
    } else {
        return parser.match('inline_not');
    }
};

//  inline_not := '!' inline_union | inline_union

rules.inline_not = function(parser, ast) {
    if ( parser.test('!') ) {
        ast.Op = parser.match('!');
        ast.Left = parser.match('inline_not');
    } else {
        return parser.match('inline_union');
    }
};

//  inline_union := inline_primary ( '|' inline_union )?

rules.inline_union = function(parser, ast) {
    ast.Left = parser.match('inline_primary');
    if ( parser.test('|') ) {
        ast.Op = parser.match('|');
        ast.Right = parser.match('inline_union');
    } else {
        return ast.Left;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_primary := inline_number | inline_string | inline_subexpr | jpath | inline_function | inline_var

rules.inline_primary = {

    rule: function(parser, ast) {
        if ( parser.test('NUMBER') ) {
            return parser.match('inline_number');
        }

        if ( parser.testAny('"', "'") ) {
            return parser.match('inline_string');
        }

        var expr;

        if ( parser.test('(') ) {
            expr = parser.match('inline_subexpr');
        } else if ( parser.testAny('.', '/') ) {
            expr = parser.match('jpath');
        } else if ( parser.testAll('SORT', '(') ) {
            expr = parser.match('sort');
        } else if ( parser.testAll('QNAME', '(') ) {
            expr = parser.match('inline_function');
        } else if ( parser.test('QNAME') ) {
            expr = parser.match('inline_var');
        } else {
            parser.error('number, string, jpath, variable or function call expected');
        }

        if ( parser.testAny('[', '.') ) {
            expr = expr.get_ast( 'jpath_filter', {
                Expr: expr,
                JPath: parser.match( 'jpath', { inContext: true } )
            } );
        }

        return expr;
    },

    options: {
        skipper: 'none'
    }

};


//  ---------------------------------------------------------------------------------------------------------------  //

rules.sort = {

    rule: function(parser, ast) {
        parser.match('SORT');
        parser.match('(');
        ast.Nodes = parser.match('inline_expr');
        parser.match(',');
        if ( parser.testAny('ASC', 'DESC') ) {
            ast.Order = parser.matchAny('ASC', 'DESC');
        } else {
            ast.Order = 'asc';
        }
        ast.By = parser.match('inline_expr');
        parser.match(')');
    },

    options: {
        skipper: 'default_'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_number := NUMBER

rules.inline_number = function(parser, ast) {
    ast.Value = parseFloat( parser.match('NUMBER') );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_string := '"' string_content '"'

rules.inline_string = {

    rule: function(parser, ast, params) {
        var quote = parser.matchAny('"', "'");
        //  FIXME: Зачем тут этот отдельный случай?
        //  Почему string_content не работает с пустой строкой?
        if ( parser.test(quote) ) {
            //  Отдельно обрабатываем пустую строку.
            ast.Value = parser.get_ast('string_literal', '');
        } else {
            ast.Value = parser.match( 'string_content', {
                noexpr: params.noexpr,
                noesc: params.noesc,
                delim: quote
            } );
        }
        parser.match(quote);
    },

    options: {
        skipper: 'none'
    }

};

//  string_content := ...

//  params.noexpr   -- запрещает интерполяцию выражений в строке.
//  params.noesc    -- не нужно учитывать esc-последовательности типа \n, \t и т.д.
//  params.delim    -- задает символ, ограничивающий строковый контент.
rules.string_content = function(parser, ast, params) {
    var s = '';

    while ( !parser.is_eol() && !parser.test(params.delim) ) {
        if ( !params.noexpr && parser.testAny('{', '}') ) {
            if ( parser.test('{{') ) {
                parser.match('{{');
                s += '{';
            } else if ( parser.test('}}') ) {
                parser.match('}}');
                s += '}';

            } else if ( parser.test('{') ) {
                if (s) {
                    ast.add( parser.get_ast('string_literal', s) );
                    s = '';
                }
                parser.match('{');
                parser.skip('spaces');
                ast.add( parser.get_ast( 'string_expr', {
                    Expr: parser.match('inline_expr')
                } ) );
                parser.skip('spaces');
                parser.match('}');
            } else {
                parser.error('Unmatched }');
            }
        } else if ( !params.noesc && parser.test('\\') ) {
            parser.match('\\');
            if ( parser.test('ESC') ) {
                var c = parser.match('ESC');
                switch (c) {
                    case 'n': s += '\n'; break;
                    case 't': s += '\t'; break;
                    default: s += c;
                }
            }

        } else {
            s += parser.current(1);
            parser.next(1);
        }
    }

    if (s) {
        ast.add( parser.get_ast('string_literal', {
            Value: s
        } ) );
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_subexpr := '(' inline_expr ')'

rules.inline_subexpr = function(parser, ast) {
    parser.match('(');
    ast.Expr = parser.match('inline_expr');
    parser.match(')');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_var := QNAME

rules.inline_var = function(parser, ast) {
    ast.Name = parser.match('QNAME');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_function := QNAME callargs

rules.inline_function = function(parser, ast) {
    ast.Name = parser.match('QNAME');
    ast.Args = parser.match('callargs');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  JPath
//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '/'? jpath_steps

rules.jpath = {

    rule: function(parser, ast, params) {
        if (params.inContext) {
            //  inContext означает, что это не полный jpath. Например, в выражении foo[42].bar это [42].bar.
            ast.InContext = true;
        } else {
            if ( !parser.testAny('.', '/') ) {
                // Полный jpath всегда должен начинаться с точки или слэша.
                parser.error('Expected . or /');
            }
        }

        //  jpath может начинаться с /, но это должен быть полный jpath, не в контексте.
        if ( !ast.InContext && parser.test('/') ) {
            parser.match('/');
            ast.Abs = true;
        } else if ( !parser.testAny('.', '[') ) {
            parser.error('Expected: . or [');
        }
        ast.Steps = parser.match('jpath_steps');
    },

    options: {
        skipper: 'none'
    }

};

//  jpath_steps := ( jpath_dots | jpath_nametest | jpath_predicate )*

rules.jpath_steps = function(parser, ast) {
    while (1) {
        if ( parser.test('DOTS') ) {
            r = parser.match('jpath_dots');
        } else if ( parser.test('.') ) {
            r = parser.match('jpath_nametest');
        } else if ( parser.test('[') ) {
            r = parser.match('jpath_predicate');
        } else {
            break;
        }

        ast.add(r);
    }
};

//  jpath_parents := '.'+

rules.jpath_dots = function(parser, ast) {
    ast.Dots = parser.match('DOTS');
    //  FIXME: Не получается одни регэкспом различить ...foo и ...
    //  Точнее различить-то мы их можем.
    //  Но в первом случае мы получаем две точки, во втором -- три,
    //  но в обоих случаях нужно сделать два шага вверх.
    //  Поэтому смотрим, если дальше осталась точка, то добавляем одну точку.
    if ( parser.test('.') ) {
        ast.Dots += '.';
    }
};

//  jpath_nametest := '.' ( QNAME | '*' )

rules.jpath_nametest = function(parser, ast) {
    parser.match('.');
    ast.Name = parser.matchAny('JSTEP', '*');
};

//  jpath_predicate := '[' multiline_expr ']'

rules.jpath_predicate = {

    rule: function(parser, ast) {
        parser.match('[');
        ast.Expr = parser.match('multiline_expr');
        parser.match(']');
    },

    options: {
        skipper: 'spaces'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  cdata := ':::' strings ':::'

rules.cdata = {

    rule: function(parser, ast) {
        parser.match(':::');

        var input = parser.input;
        var s = [];

        while ( !input.isEOF() ) {
            var line = input.current();

            var i = line.indexOf(':::');
            if (i > -1) {
                s.push( line.substr(0, i) );
                input.next(i);
                break;
            }

            s.push(line);
            input.nextLine();
        }

        parser.match(':::');

        var indent = 1000;
        for (var i = 1; i < s.length; i++) {
            indent = Math.min( indent, /^(\s*)/.exec( s[i] )[1].length );
        }

        if (indent) {
            for (var i = 1; i < s.length; i++) {
                s[i] = s[i].substr(indent);
            }
        }

        ast.Value = parser.get_ast( 'string_literal', {
            Value: s.join('\n')
        } );
    },

    options: {
        skipper: 'none'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Skippers
//  ---------------------------------------------------------------------------------------------------------------  //

grammar.skippers = {};

//  ---------------------------------------------------------------------------------------------------------------  //

grammar.skippers.default_ = function(parser) {
    var r = false;
    while (1) {
        var l = parser.skip('spaces') || parser.skip('inlineComments') || parser.skip('jsBlockComments') || parser.skip('htmlBlockComments');
        r = r || l;
        if (!l) { break; }
    }
    return r;
};

grammar.skippers.spaces = /^[\ \t]+/;

grammar.skippers.whitespaces = function(parser) {
    parser.skip('spaces');
    if ( parser.is_eol() ) {
        parser.eol();
    }
    parser.skip('spaces');
};

grammar.skippers.none = function(parser) {};

grammar.skippers.inlineComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.current(2) != '//') {
        return;
    }

    //  FIXME
    parser.next( parser.current().length );

    return true;
};

grammar.skippers.jsBlockComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.current(2) !== '/*') {
        return false;
    }
    parser.next(2);

    while ( !parser.is_eof() ) {
        var i = parser.current().indexOf('*/');
        if (i == -1) {
            parser.nextLine();
        } else {
            parser.next(i);
            break;
        }
    }
    if (parser.current(2) != '*/') {
        parser.error('Expected */');
    }
    parser.next(2);

    return true;
};

grammar.skippers.htmlBlockComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.current(4) !== '<!--') {
        return false;
    }
    parser.next(4);

    while ( !parser.is_eof() ) {
        var i = parser.current().indexOf('-->');
        if (i == -1) {
            parser.nextLine();
        } else {
            parser.next(i);
            break;
        }
    }
    if (parser.current(3) != '-->') {
        parser.error('Expected -->');
    }
    parser.next(3);

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.grammar = new yate.Grammar(grammar);

//  ---------------------------------------------------------------------------------------------------------------  //

