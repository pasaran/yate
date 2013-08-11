var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var grammar = {};

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
    'key',
    'apply',
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

//  ---------------------------------------------------------------------------------------------------------------  //
//  Blocks
//  ---------------------------------------------------------------------------------------------------------------  //

//  module := ('module' inline_string EOL)? block

rules.module = {

    rule: function(parser, ast) {
        /*
            FIXME: Убрать это. Название модуля берется из имени файла.
        while ( parser.is_eol() ) {
            parser.nextline();
        }

        if ( parser.is_token('MODULE') ) {
            ast.Name = parser.match('module_name');
        }
        */

        ast.Block = parser.match( 'block', { toplevel: true } );

        parser.eof();
    },

    options: {
        skipper: 'default_'
    }

};

rules.module_name = function(parser, ast) {
    parser.token('MODULE');

    ast.Name = parser.match( 'inline_string', { noexpr: true } ).asString();

    parser.eol();
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  block := ( import | include | template | function_ | key | var_ | block_expr )*

var rx_spaces = /^[ \t]+/;

rules.block = function(parser, ast, params) {
    params = params || {};

    var Items = ast.Items;

    //  Блок верхнего уровня (module) заканчивается с концом файла.
    //  Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.
    while ( !( parser.is_eof() || parser.is_token('}') || parser.is_token(']') || parser.is_token(')') ) ) {
        var non_spaces = parser.input.replace(rx_spaces, '');

        if (!non_spaces) {
            parser.nextline();
            parser.skip();
            continue;
        }

        var chars = non_spaces.substr(0, 2);

        if (chars === '//') {
            parser.nextline();
            parser.skip();
            continue;
        }

        if (chars === '/*') {
            parser.nextline();
            parser.skip();
            while ( !parser.is_eof() ) {
                var i = parser.input.indexOf('*/');
                if (i > -1) {
                    parser.move(i + 2);
                    parser.skip('spaces');
                    parser.eol();
                }
            }
            continue;
        }

        var r = null;
        if (params.toplevel) {
            if ( parser.is_token('IMPORT') ) {
                r = parser.match('import');

            } else if ( parser.is_token('MATCH') ) {
                r = parser.match('template');

            } else if ( parser.is_token('KEY') ) {
                r = parser.match('key');

            } else if ( parser.is_token('EXTERNAL') ) {
                r = parser.match('external');

            }
        }

        if (!r) {
            if ( parser.is_token('FUNC') ) {
                r = parser.match('function_');

            } else if ( parser.is_token('INCLUDE') ) {
                r = parser.match('include');

            } else if ( parser.is_tokens('QNAME', '=') ) {
                r = parser.match('var_');

            } else {
                r = parser.match('block_expr');

            }
        }

        Items.add(r);

        //  Если после выражения или определения нет перевода строки, то это конец блока.
        if ( !parser.is_eol() ) {
            break;
        }

        parser.nextline();
        parser.skip();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  body := '{' block '}'

rules.body = function(parser, ast) {
    parser.token('{');
    ast.Block = parser.match('block');
    parser.token('}');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  import := 'import' inline_string

rules.import = function(parser, ast) {
    parser.token('IMPORT');

    ast.Name = parser.match( 'inline_string', { noexpr: true } ).asString();
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  include := 'include' inline_string

rules.include = function(parser, ast) {
    parser.token('INCLUDE');

    var filename = parser.match( 'inline_string', { noexpr: true } ).asString();
    var dirname = path_.dirname(parser.filename);

    ast.Filename = path_.resolve(dirname, filename);
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Declarations: templates, functions, keys, vars
//  ---------------------------------------------------------------------------------------------------------------  //

//  template := 'match' jpath ( '|' jpath )* template_mode? arglist? body

rules.template = function(parser, ast) {
    parser.token('MATCH');
    ast.Selectors = parser.match('template_selectors');

    ast.Mode = parser.match('template_mode');
    if ( parser.is_token('(') ) {
        ast.Args = parser.match('arglist');
    }
    ast.Body = parser.match('body');
};

//  template_selectors := jpath ( '|' jpath )*

rules.template_selectors = function(parser, ast) {
    ast.add( parser.match('jpath') );
    while ( parser.is_token('|') ) {
        parser.token('|');
        ast.add( parser.match('jpath') );
    }
};

//  template_mode := QNAME

rules.template_mode = function(parser, ast) {
    if ( parser.is_token('QNAME') ) {
        ast.Value = parser.token('QNAME');
    } else {
        ast.Value = '';
    }
};

//  arglist := '(' arglist_item ( ',' arglist_item )* ')'

rules.arglist = function(parser, ast) {
    parser.token('(');
    if ( !parser.is_token(')') ) {
        ast.add( parser.match('arglist_item') );
        while ( parser.is_token(',') ) {
            parser.token(',');
            ast.add( parser.match('arglist_item') );
        }
    }
    parser.token(')');
};

//  arglist_item := ( 'nodeset', 'boolean', 'scalar', 'attr', 'xml', 'object', 'array' )? QNAME ( '=' inline_expr )?

rules.arglist_item = function(parser, ast) {
    var r;
    if (( r = test_typedef(parser) )) {
        ast.Typedef = parser.token(r);
    }

    ast.Name = parser.token('QNAME');
    if ( parser.is_token('=') ) {
        parser.token('=');
        ast.Default = parser.match('inline_expr');
    }
};

function test_typedef(parser) {
    return (
        parser.is_token('NODESET') ||
        parser.is_token('BOOLEAN') ||
        parser.is_token('SCALAR') ||
        parser.is_token('ATTR') ||
        parser.is_token('XML') ||
        parser.is_token('OBJECT') ||
        parser.is_token('ARRAY')
    );
}

function match_typedef(parser) {
    var r = test_typedef(parser);

    if (!r) {
        parser.error('Typedef required');
    }

    return parser.token(r);
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  function_ := 'func' QNAME arglist body

rules.function_ = function(parser, ast) {
    parser.token('FUNC');
    ast.Name = parser.token('QNAME');
    ast.Args = parser.match('arglist');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  external := 'external' typedef QNAME argtypes

rules.external = function(parser, ast) {
    parser.token('EXTERNAL');
    ast.Type = match_typedef(parser);
    ast.Name = parser.token('QNAME');
    //  FIXME: А почему это не Items?
    ast.ArgTypes = parser.match('argtypes');
};

// argtypes := '(' ( typedef ( ',' typedef )* )? ')'

rules.argtypes = function(parser) {
    var types = [];

    parser.token('(');
    if ( !parser.is_token(')') ) {
        //  FIXME: Сделать не массив, а items.
        types.push( match_typedef(parser) );
        while ( parser.is_token(',') ) {
            parser.token(',');
            types.push( match_typedef(parser) );
        }
    }
    parser.token(')');

    return types;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  key := 'key' QNAME '(' inline_expr ',' inline_expr ')' body

rules.key = function(parser, ast) {
    parser.token('KEY');
    ast.Name = parser.token('QNAME');
    parser.token('(');
    ast.Nodes = parser.match('inline_expr');
    parser.token(',');
    ast.Use = parser.match('inline_expr');
    parser.token(')');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  var_ := QNAME '=' block_expr

rules.var_ = function(parser, ast) {
    ast.Name = parser.token('QNAME');
    parser.token('=');
    ast.Value = parser.match('block_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Block expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  block_expr := if_ | for_ | apply | attr | xml_line | array | object | pair | subexpr

rules.block_expr = function(parser) {
    var r;

    if ( parser.is_token('IF') ) {
        r = parser.match('if_');
    } else if ( parser.is_token('FOR') ) {
        r = parser.match('for_');
    } else if ( parser.is_token('APPLY') ) {
        r = parser.match('apply');
    } else if ( parser.is_token(':::') ) {
        r = parser.match('cdata');
    } else if ( parser.is_token('@') ) {
        r = parser.match('attr');
    } else if ( parser.is_token('<') ) {
        r = parser.match('xml_line');
    } else if ( parser.is_token('[') ) {
        r = parser.match('array');
    } else if ( parser.is_token('{') ) {
        r = parser.match('object');
    } else if ( parser.is_token('"') || parser.is_token("'") ) {
        //  Ручной lookahead.
        //  В этом месте может быть либо inline_expr, либо же pair.
        //  Увы, длина в токенах inline_string может быть какой угодно,
        //  так что проверить один-два-эн токенов невозможно.
        //  Поэтому матчим inline_string, смотрим, есть ли за ним двоеточие.
        //  Потом откатываемся назад и матчим уже нужное.

        var state = parser.get_state();

        parser.match('inline_string');
        var is_pair = parser.is_token(':');

        parser.set_state(state);

        if (is_pair) {
            r = parser.match('pair');
        } else {
            r = parser.match('value');
        }

    } else {
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

        var is_subexpr = false;

        if ( parser.is_token('(') ) {
            var pos = parser.get_pos();

            parser.token('(');
            is_subexpr = parser.is_eol();

            parser.set_pos(pos);
        }

        if (is_subexpr) {
            r = parser.match('subexpr');
        } else {
            r = parser.match('value');
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  if_ := 'if' multiline_expr body else_if* else_?

rules.if_ = function(parser, ast) {
    parser.token('IF');
    //  FIXME: Убить эти multiline_expr.
    ast.Condition = parser.match('multiline_expr');
    ast.Then = parser.match('body');
    var Elses = ast.Elses;
    while ( parser.is_token('ELSE IF') ) {
        Elses.add( parser.match('else_if') );
    }
    if ( parser.is_token('ELSE') ) {
        Elses.add( parser.match('else_') );
    }
};

//  else_if := 'else if' multiline_expr body

rules.else_if = function(parser, ast) {
    parser.token('ELSE IF');
    ast.Condition = parser.match('multiline_expr');
    ast.Body = parser.match('body');
};

//  else_ := 'else' body

rules.else_ = function(parser, ast) {
    parser.token('ELSE');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  for_ := 'for' multiline_expr body

rules.for_ = function(parser, ast) {
    parser.token('FOR');
    ast.Selector = parser.match('multiline_expr');
    ast.Body = parser.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  apply := 'apply' ( inline_expr | array | object ) template_mode? callargs?

rules.apply = function(parser, ast) {
    parser.token('APPLY');

    if ( parser.is_token('{') ) {
        ast.Expr = parser.match('object');
    } else if ( parser.is_token('[') ) {
        ast.Expr = parser.match('array');
    } else {
        ast.Expr = parser.match('inline_expr');
    }
    /*
    var r = parser.is_any_token('inline_expr', 'array', 'object');
    if (!r) {
        parser.error('Expected expr');
    }

    p.Expr = parser.match(r);
    */

    ast.Mode = parser.match('template_mode');
    if ( parser.is_token('(') ) {
        ast.Args = parser.match('callargs');
    }
};

//  callargs := '(' ( callarg ( ',' callarg )* )? ')'

rules.callargs = function(parser, ast) {
    parser.token('(');
    if ( !parser.is_token(')') ) {
        ast.add( parser.match('callarg') );
        while ( parser.is_token(',') ) {
            parser.token(',');
            ast.add( parser.match('callarg') );
        }
    }
    parser.token(')');
};

//  callarg := object | array | multiline_expr

rules.callarg = {
    rule: function(parser, ast) {
        if ( parser.is_token('{') ) {
            ast.Expr = parser.match('object');
        } else if ( parser.is_token('[') ) {
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
    parser.token('@');

    ast.Name = parser.match('string_content', { noesc: true, delim: 'ATTR_END' });

    //  FIXME: Нельзя ли это в string_content унести?
    parser.skip('spaces');

    var r;
    //  FIXME: match_any?
    if (( r = parser.is_token('+=') || parser.is_token('=') )) {
        ast.Op = parser.token(r);
        ast.Value = parser.match('block_expr');
    } else {
        parser.error('"=" or "+=" expected');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  array := '[' block ']'

rules.array = function(parser, ast) {
    //  FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    parser.token('[');
    ast.Block = parser.match('block');
    parser.token(']');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  object := '{' block '}'

rules.object = function(parser, ast) {
    //  FIXME: Поддержать инлайновый вариант: { "foo": 42, "bar": 24 }.
    parser.token('{');
    ast.Block = parser.match('block');
    parser.token('}');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  pair := inline_expr ':' block_expr

rules.pair = function(parser, ast) {
    ast.Key = parser.match('inline_expr');
    parser.token(':');
    ast.Value = parser.match('block_expr');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' block ')'

rules.subexpr = function(parser, ast) {
    parser.token('(');
    ast.Block = parser.match('block');
    parser.token(')');
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
            if ( parser.is_token('</') ) {
                ast.add( parser.match('xml_end') );
            } else if ( parser.is_token('<') ) {
                ast.add( match_xml_start(parser) );
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
        while (( r = parser.is_any_token('xml_full', 'xml_empty', 'xml_text') )) {
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

    parser.token('<');
    r.Name = parser.token('QNAME');
    r.Attrs = parser.match('xml_attrs');

    if ( parser.is_token('>') ) {
        parser.token('>');

        return parser.get_ast('xml_start', r);
    } else {
        parser.token('/>');

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
    if ( parser.is_token('</>') ) {
        parser.token('</>');
        ast.Name = true;
    } else {
        parser.token('</');
        ast.Name = parser.token('QNAME');
        parser.skip('spaces');
        parser.token('>');
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
            } else if ( !parser.is_token('>') && !parser.is_token('/>') ) {
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
    ast.Name = parser.token('QNAME');
    parser.token('=');
    ast.Value = parser.match('inline_string');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Inline expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_expr := inline_or

rules.inline_expr = {

    rule: function(parser) {
        return parser.match('inline_or');
    },

    options: {
        skipper: 'spaces'
    }

};

//  FIXME: Истребить!
rules.multiline_expr = {

    rule: function(parser) {
        return parser.match('inline_or');
    },

    options: {
        skipper: 'whitespaces'
    }

};

//  inline_or := inline_and ( '||' inline_or )?

rules.inline_or = function(parser, ast) {
    ast.Left = parser.match('inline_and');
    if ( parser.is_token('||') ) {
        ast.Op = parser.token('||');
        ast.Right = parser.match('inline_or');
    } else {
        return ast.Left;
    }
};

//  inline_and := inline_eq ( '&&' inline_and )?

rules.inline_and = function(parser, ast) {
    ast.Left = parser.match('inline_eq');
    if ( parser.is_token('&&') ) {
        ast.Op = parser.token('&&');
        ast.Right = parser.match('inline_and');
    } else {
        return ast.Left;
    }
};

//  inline_eq := inline_rel ( ( '==' | '!=' ) inline_rel )?

rules.inline_eq = function(parser, ast) {
    ast.Left = parser.match('inline_rel');
    var op;
    if (( op = parser.is_token('==') || parser.is_token('!=') )) {
        ast.Op = parser.token(op);
        ast.Right = parser.match('inline_rel');
    } else {
        return ast.Left;
    }
};

//  inline_rel := inline_add ( ( '<=' | '<' | '>=' | '>' ) inline_add )?

rules.inline_rel = function(parser, ast) {
    ast.Left = parser.match('inline_add');
    var op;
    if (( op = parser.is_token('<=') || parser.is_token('<') || parser.is_token('>=') || parser.is_token('>') )) {
        ast.Op = parser.token(op);
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
    if (( op = parser.is_token('+') || parser.is_token('-') )) {
        ast.Op = parser.token(op);
        ast.Right = parser.match('inline_add');
    } else {
        return ast.Left;
    }
};

//  inline_mul := inline_unary ( ( '/' | '*' | '%' ) inline_mul )?

rules.inline_mul = function(parser, ast) {
    ast.Left = parser.match('inline_unary');
    var op;
    if (( op = parser.is_token('/') || parser.is_token('*') || parser.is_token('%') )) {
        ast.Op = parser.token(op);
        ast.Right = parser.match('inline_mul');
    } else {
        return ast.Left;
    }
};

//  inline_unary := '-' inline_not | inline_not

rules.inline_unary = function(parser, ast) {
    if ( parser.is_token('-') ) {
        ast.Op = parser.token('-');
        ast.Left = parser.match('inline_not');
    } else {
        return parser.match('inline_not');
    }
};

//  inline_not := '!' inline_union | inline_union

rules.inline_not = function(parser, ast) {
    if ( parser.is_token('!') ) {
        ast.Op = parser.token('!');
        ast.Left = parser.match('inline_not');
    } else {
        return parser.match('inline_union');
    }
};

//  inline_union := inline_primary ( '|' inline_union )?

rules.inline_union = function(parser, ast) {
    ast.Left = parser.match('inline_primary');
    if ( parser.is_token('|') ) {
        ast.Op = parser.token('|');
        ast.Right = parser.match('inline_union');
    } else {
        return ast.Left;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_primary := inline_number | inline_string | inline_subexpr | jpath | inline_function | inline_var

rules.inline_primary = {

    rule: function(parser, ast) {
        if ( parser.is_token('NUMBER') ) {
            return parser.match('inline_number');
        }

        if ( parser.is_token('"') || parser.is_token("'") ) {
            return parser.match('inline_string');
        }

        var expr;

        if ( parser.is_token('(') ) {
            expr = parser.match('inline_subexpr');

        } else if ( parser.is_token('.') || parser.is_token('/') ) {
            expr = parser.match('jpath');

        } else if ( parser.is_tokens('SORT', '(') ) {
            expr = parser.match('sort');

        } else if ( parser.is_tokens('QNAME', '(') ) {
            expr = parser.match('inline_function');

        } else if ( parser.is_token('QNAME') ) {
            expr = parser.match('inline_var');

        } else {
            parser.error('number, string, jpath, variable or function call expected');

        }

        if ( parser.is_token('[') || parser.is_token('.') ) {
            expr = parser.get_ast( 'jpath_filter', {
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
        parser.token('SORT');
        parser.token('(');
        ast.Nodes = parser.match('inline_expr');
        parser.token(',');
        if ( parser.is_token('ASC') || parser.is_token('DESC') ) {
            ast.Order = parser.match_any('ASC', 'DESC');
        } else {
            ast.Order = 'asc';
        }
        ast.By = parser.match('inline_expr');
        parser.token(')');
    },

    options: {
        skipper: 'default_'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_number := NUMBER

rules.inline_number = function(parser, ast) {
    ast.Value = parseFloat( parser.token('NUMBER') );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_string := '"' string_content '"'

rules.inline_string = {

    rule: function(parser, ast, params) {
        params = params || {};

        var quote = parser.match_any('"', "'");
        //  FIXME: Зачем тут этот отдельный случай?
        //  Почему string_content не работает с пустой строкой?
        if ( parser.is_token(quote) ) {
            //  Отдельно обрабатываем пустую строку.
            ast.Value = parser.get_ast('string_literal', {
                Value: ''
            });
        } else {
            ast.Value = parser.match( 'string_content', {
                noexpr: params.noexpr,
                noesc: params.noesc,
                delim: quote
            } );
        }
        parser.token(quote);
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
    params = params || {};

    var s = '';

    while ( !parser.is_eol() && !parser.is_token(params.delim) ) {
        if ( !params.noexpr && parser.is_token('{') || parser.is_token('}') ) {
            if ( parser.is_token('{{') ) {
                parser.token('{{');
                s += '{';
            } else if ( parser.is_token('}}') ) {
                parser.token('}}');
                s += '}';

            } else if ( parser.is_token('{') ) {
                if (s) {
                    ast.add( parser.get_ast('string_literal', {
                        Value: s
                    }) );
                    s = '';
                }
                parser.token('{');
                parser.skip('spaces');
                ast.add( parser.get_ast( 'string_expr', {
                    Expr: parser.match('inline_expr')
                } ) );
                parser.skip('spaces');
                parser.token('}');
            } else {
                parser.error('Unmatched }');
            }
        } else if ( !params.noesc && parser.is_token('\\') ) {
            parser.token('\\');
            if ( parser.is_token('ESC') ) {
                var c = parser.token('ESC');
                switch (c) {
                    case 'n': s += '\n'; break;
                    case 't': s += '\t'; break;
                    default: s += c;
                }
            }

        } else {
            s += parser.next(1);
            parser.move(1);
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
    parser.token('(');
    ast.Expr = parser.match('inline_expr');
    parser.token(')');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_var := QNAME

rules.inline_var = function(parser, ast) {
    ast.Name = parser.token('QNAME');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_function := QNAME callargs

rules.inline_function = function(parser, ast) {
    ast.Name = parser.token('QNAME');
    ast.Args = parser.match('callargs');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  JPath
//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '/'? jpath_steps

rules.jpath = {

    rule: function(parser, ast, params) {
        params = params || {};

        if (params.inContext) {
            //  inContext означает, что это не полный jpath. Например, в выражении foo[42].bar это [42].bar.
            ast.InContext = true;
        } else {
            if ( !( parser.is_token('.') || parser.is_token('/') ) ) {
                // Полный jpath всегда должен начинаться с точки или слэша.
                parser.error('Expected . or /');
            }
        }

        //  jpath может начинаться с /, но это должен быть полный jpath, не в контексте.
        if ( !ast.InContext && parser.is_token('/') ) {
            parser.token('/');
            ast.Abs = true;
        } else if ( !( parser.is_token('.') || parser.is_token('[') ) ) {
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
        if ( parser.is_token('DOTS') ) {
            r = parser.match('jpath_dots');
        } else if ( parser.is_token('.') ) {
            r = parser.match('jpath_nametest');
        } else if ( parser.is_token('[') ) {
            r = parser.match('jpath_predicate');
        } else {
            break;
        }

        ast.add(r);
    }
};

//  jpath_parents := '.'+

rules.jpath_dots = function(parser, ast) {
    ast.Dots = parser.token('DOTS');
    //  FIXME: Не получается одни регэкспом различить ...foo и ...
    //  Точнее различить-то мы их можем.
    //  Но в первом случае мы получаем две точки, во втором -- три,
    //  но в обоих случаях нужно сделать два шага вверх.
    //  Поэтому смотрим, если дальше осталась точка, то добавляем одну точку.
    if ( parser.is_token('.') ) {
        ast.Dots += '.';
    }
};

//  jpath_nametest := '.' ( QNAME | '*' )

rules.jpath_nametest = function(parser, ast) {
    parser.token('.');
    ast.Name = parser.match_any('JSTEP', '*');
};

//  jpath_predicate := '[' multiline_expr ']'

rules.jpath_predicate = {

    rule: function(parser, ast) {
        parser.token('[');
        ast.Expr = parser.match('multiline_expr');
        parser.token(']');
    },

    options: {
        skipper: 'spaces'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  cdata := ':::' strings ':::'

rules.cdata = {

    rule: function(parser, ast) {
        parser.token(':::');

        var s = [];

        while ( !parser.is_eof() ) {
            var line = parser.input;

            var i = line.indexOf(':::');
            if (i > -1) {
                s.push( line.substr(0, i) );
                parser.move(i);
                break;
            }

            s.push(line);
            parser.nextline();
        }

        parser.token(':::');

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
    //  FIXME: while
    if ( parser.is_eol() ) {
        parser.eol();
    }
    parser.skip('spaces');
};

grammar.skippers.none = function(parser) {};

grammar.skippers.inlineComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.next(2) != '//') {
        return;
    }

    //  FIXME
    parser.move( parser.input.length );

    return true;
};

grammar.skippers.jsBlockComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.next(2) !== '/*') {
        return false;
    }
    parser.move(2);

    while ( !parser.is_eof() ) {
        var i = parser.input.indexOf('*/');
        if (i == -1) {
            parser.nextline();
        } else {
            parser.move(i);
            break;
        }
    }
    if (parser.next(2) != '*/') {
        parser.error('Expected */');
    }
    parser.move(2);

    return true;
};

grammar.skippers.htmlBlockComments = function(parser) {
    if ( parser.is_eof() ) { return; }

    if (parser.next(4) !== '<!--') {
        return false;
    }
    parser.move(4);

    while ( !parser.is_eof() ) {
        var i = parser.input.indexOf('-->');
        if (i == -1) {
            parser.nextline();
        } else {
            parser.move(i);
            break;
        }
    }
    if (parser.next(3) != '-->') {
        parser.error('Expected -->');
    }
    parser.move(3);

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = grammar;

//  ---------------------------------------------------------------------------------------------------------------  //


