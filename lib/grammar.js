var path_ = require('path');

var Grammar = require('parse-tools/grammar.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//  Yate grammar
//  ---------------------------------------------------------------------------------------------------------------  //

grammar = {};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Tokens

grammar.tokens = {
    QNAME: /^[a-zA-Z_][a-zA-Z0-9_-]*/,
    //  либо (...), либо (..)(.foo) -- то есть если после точек есть идентификатор, то последнюю точку не берем.
    DOTS: /^(?:\.{2,}(?=\.[a-zA-Z_*])|\.+(?![a-zA-Z_*]))/,
    ESC: /^["'\\nt]/,
    NUMBER: /^[0-9]+(\.[0-9]+)?/,
    '/': /^\/(?!\/)/,
    '|': /^\|(?!\|)/,
    '=': /^=(?!=)/
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
    'for',
    'if',
    'else',
    'apply',
    'key',
    'nodeset',
    'boolean',
    'scalar',
    'attr',
    'xml'
];


//  ---------------------------------------------------------------------------------------------------------------  //

//  Rules

var rules = grammar.rules = {};

rules.eol = function() {
    var input = this.input;
    if ( !input.isEOL() ) {
        this.error('EOL expected');
    }
    input.nextLine();
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Blocks
//  ---------------------------------------------------------------------------------------------------------------  //

//  module := block

rules.module = {

    rule: function(ast) {
        ast.Name = this.match('module_name');
        ast.Block = this.match('block');

        if ( !this.input.isEOF() ) {
            this.error('EOF expected');
        }

    },

    options: {
        skipper: 'default_'
    }

};

rules.module_name = function() {
    if ( this.test('MODULE') ) {
        this.match('MODULE');

        var name = this.match( 'inline_string', { noexpr: true } );
        this.match('eol');

        return name.asString();
    }

    //  Дефолтное название для модуля.
    return 'main';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  block := ( import | include | template | function_ | key | var_ | block_expr )*

rules.block = function(ast) {
    var input = this.input;

    //  Блок верхнего уровня (module) заканчивается с концом файла.
    //  Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.
    while ( !( input.isEOF() || this.testAny( [ '}', ']', ')' ] ) ) ) {
        //  Пропускаем пустые строки.
        if ( input.isEOL() ) {
            this.match('eol');
            continue;
        }

        var r = null;
        if ( this.test('IMPORT') ) {
            ast.Imports.add( this.match('import') );

        } else if ( this.test('INCLUDE') ) {
            ast.mergeWith( this.match('include').Block );

        } else if ( this.test('MATCH') ) {
            ast.Templates.add( this.match('template') );

        } else if ( this.test('KEY') ) {
            ast.Defs.add( this.match('key') );

        } else if ( this.test('FUNC') ) {
            ast.Defs.add( this.match('function_') );

        } else if ( this.test('EXTERNAL') ) {
            ast.Defs.add( this.match('external') );

        } else if ( this.testAll( [ 'QNAME', '=' ] ) ) {
            ast.Defs.add( this.match('var_') );

        } else {
            ast.Exprs.add( this.match('block_expr') );

        }

        //  Если после выражения или определения нет перевода строки, то это конец блока.
        if ( !input.isEOL() ) {
            break;
        }

        this.match('eol');
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  body := '{' block '}' | '[' block ']'

rules.body = function(ast) {
    //  Блоки бывают двух видов. Обычные { ... } и со списочным контекстом [ ... ].
    //  В [ ... ] каждое выражение верхнего уровня генерит отдельный элемент списка.
    var start = this.testAny( [ '{', '[' ] );
    if (start) {
        this.match(start);

        ast.Block = this.match('block');
        /*
        if (start == '[') {
            ast.AsList = true;
        }
        */

        var end = (start == '{') ? '}' : ']';
        this.match(end);
    } else {
        //  FIXME: Кажется, тут нужно использовать this.backtrace().
        this.error('Expected { or [');
    }

};


//  ---------------------------------------------------------------------------------------------------------------  //

//  import := 'import' inline_string

rules.import = function(ast) {
    this.match('IMPORT');
    ast.Name = this.match( 'inline_string', { noexpr: true } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  include := 'include' inline_string

rules.include = function() {
    this.match('INCLUDE');

    var filename = this.match( 'inline_string', { noexpr: true } ).asString();

    return this.subparser().parse(filename, 'module');
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Declarations: templates, functions, keys, vars
//  ---------------------------------------------------------------------------------------------------------------  //

//  template := 'match' ( root | jpath ) template_mode? arglist? body

rules.template = function(ast) {
    this.match('MATCH');

    if ( this.test('/') ) {
        ast.Selector = this.match('root');
    } else if ( this.test('.') ) {
        ast.Selector = this.match('jpath');
    } else {
        this.error('Expected: / or jpath');
    }

    ast.Mode = this.match('template_mode')
    if ( this.test('(') ) {
        ast.Args = this.match('arglist');
    }
    ast.Body = this.match('body');
};

//  template_mode := QNAME

rules.template_mode = function(ast) {
    if ( this.test('QNAME') ) {
        ast.Value = this.match('QNAME');
    } else {
        ast.Value = '';
    }
};

//  arglist := '(' arglist_item ( ',' arglist_item )* ')'

rules.arglist = function(ast) {
    this.match('(');
    if ( this.test('arglist_item') ) {
        ast.add( this.match('arglist_item') );
        while ( this.test(',') ) {
            this.match(',');
            ast.add( this.match('arglist_item') );
        }
    }
    this.match(')');
};

//  arglist_item := ( 'nodeset', 'boolean', 'scalar' )? QNAME ( '=' inline_expr )?

rules.arglist_item = function(ast) {
    if ( this.test('typedef') ) {
        ast.Typedef = this.match('typedef');
    }
    ast.Name = this.match('QNAME');
    if ( this.test('=') ) {
        this.match('=');
        ast.Default = this.match('inline_expr');
    }
};

rules.typedef = function() {
    return this.matchAny( [ 'NODESET', 'BOOLEAN', 'SCALAR', 'ATTR', 'XML' ] );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  function_ := 'func' QNAME arglist body

rules.function_ = function(ast) {
    this.match('FUNC');
    ast.Name = this.match('QNAME');
    ast.Args = this.match('arglist');
    ast.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  external := 'external' typedef QNAME argtypes

rules.external = function(ast) {
    this.match('EXTERNAL');
    ast.Type = this.match('typedef');
    ast.Name = this.match('QNAME');
    ast.ArgTypes = this.match('argtypes');
};

// argtypes := '(' ( typedef ( ',' typedef )* )? ')'

rules.argtypes = function() {
    var types = [];

    this.match('(');
    if ( this.test('typedef') ) {
        types.push( this.match('typedef') );
        while ( this.test(',') ) {
            this.match(',');
            types.push( this.match('typedef') );
        }
    }
    this.match(')');

    return types;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  key := 'key' QNAME '(' inline_expr ',' inline_expr ')' body

rules.key = function(ast) {
    this.match('KEY');
    ast.Name = this.match('QNAME');
    this.match('(');
    ast.Nodes = this.match('inline_expr');
    this.match(',');
    ast.Use = this.match('inline_expr');
    this.match(')');
    ast.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  var_ := QNAME '=' block_expr

rules.var_ = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('block_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Block expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  block_expr := if_ | for_ | apply | attr | xml_line | array | object | pair | subexpr

rules.block_expr = function() {
    var r;

    if ( this.test('IF') ) {
        r = this.match('if_');
    } else if ( this.test('FOR') ) {
        r = this.match('for_');
    } else if ( this.test('APPLY') ) {
        r = this.match('apply');
    } else if ( this.test('@') ) {
        r = this.match('attr');
    } else if ( this.test('<') ) {
        r = this.match('xml_line');
    } else if ( this.test('[') ) {
        r = this.match('array');
    } else if ( this.test('{') ) {
        r = this.match('object');
    } else if ( this.testAll( [ 'inline_string', ':' ] ) ) {
        r = this.match('pair');
    } else if ( !this.test('(') ) {
        r = this.match('value');
    } else {
        //  Здесь всегда следующий символ это '('.

        //  FIXME: Важно, чтобы value шел перед subexpr. Иначе выражение вида (...) && (...) будет приводить к ошибке.
        if ( this.test('value') ) {
            r = this.match('value');
        } else {
            r = this.match('subexpr');
        }
    }

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  if_ := 'if' inline_expr body ( 'else' body )?

rules.if_ = function(ast) {
    this.match('IF');
    ast.Condition = this.match('inline_expr');
    ast.Then = this.match('body');
    if ( this.test('ELSE') ) {
        this.match('ELSE');
        ast.Else = this.match('body');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  for_ := 'for' inline_expr body

rules.for_ = function(ast) {
    this.match('FOR');
    ast.Selector = this.match('inline_expr');
    ast.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  apply := 'apply' ( inline_expr | array | object ) template_mode? callargs?

rules.apply = function(ast) {
    this.match('APPLY');
    var r = this.testAny( [ 'inline_expr', 'array', 'object' ] );
    if (!r) {
        this.error('Expected expr');
    }

    ast.Expr = this.match(r);
    ast.Mode = this.match('template_mode');
    if ( this.test('(') ) {
        ast.Args = this.match('callargs');
    }
};

//  callargs := '(' ( inline_expr ( ',' inline_expr )* )? ')'

rules.callargs = function(ast) {
    this.match('(');
    if ( !this.test(')') ) {
        ast.add( this.match('callarg') );
        while ( this.test(',') ) {
            this.match(',');
            ast.add( this.match('callarg') );
        }
    }
    this.match(')');
};

rules.callarg = function(ast) {
    ast.Expr = this.match('inline_expr');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  attr := '@' QNAME ( '=' | '+=' ) block_expr

rules.attr = function(ast) {
    this.match('@');

    if ( this.test('{') ) {
        this.match('{');
        ast.Name = this.match('inline_expr');
        this.match('}');
    } else {
        ast.Name = ast.make( 'string_literal', this.match('QNAME') );
    }

    var r;
    if (( r = this.testAny( [ '+=', '=' ] ) )) {
        ast.Op = this.match(r);
        ast.Value = this.match('block_expr');
    } else {
        this.error('"=" or "+=" expected');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  array := '[' block ']'

rules.array = function(ast) {
    //  FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    this.match('[');
    ast.Block = this.match('block');
    this.match(']');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  object := '{' block '}'

rules.object = function(ast) {
    //  FIXME: Поддержать инлайновый вариант: { "foo": 42, "bar": 24 }.
    this.match('{');
    ast.Block = this.match('block');
    this.match('}');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  pair := inline_expr ':' block_expr

rules.pair = function(ast) {
    ast.Key = this.match('inline_expr');
    this.match(':');
    ast.Value = this.match('block_expr');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' block ')'

rules.subexpr = function(ast) {
    this.match('(');
    ast.Block = this.match('block');
    this.match(')');
};

//  ---------------------------------------------------------------------------------------------------------------  //

rules.value = function(ast) {
    ast.Value = this.match('inline_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  XML
//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_line := (xml_full | xml_empty | xml_start | xml_end)+

rules.xml_line = {

    rule: function(ast) {
        var r;
        while (( r = this.testAny( [ 'xml_full', 'xml_empty', 'xml_start', 'xml_end' ] ) )) {
            ast.add( this.match(r) );
        }
    },

    options: {
        skipper: 'none'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_full := xml_start ( xml_full | xml_empty | xml_text )* xml_end

rules.xml_full = function(ast) {
    var start = this.match('xml_start');
    ast.add(start);

    var r;
    while (( r = this.testAny( [ 'xml_full', 'xml_empty', 'xml_text' ] ) )) {
        ast.add( this.match(r) );
    }

    var end = this.match('xml_end');
    ast.add(end);

    //  FIXME: Унести это куда-то в .action().
    if (end.Name === true) {
        end.Name = start.Name;
    }

    if (start.Name != end.Name) {
        this.backtrace();
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_start := '<' QNAME ( xml_attrs )? '>'

rules.xml_start = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xml_attrs');
    this.match('>');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_empty := '<' QNAME ( xml_attrs )? '/>'

rules.xml_empty = function(ast) {
    this.match('<');
    ast.Name = this.match('QNAME');
    ast.Attrs = this.match('xml_attrs');
    this.match('/>');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_end := '</' QNAME '>'

rules.xml_end = function(ast) {
    if ( this.test('</>') ) {
        this.match('</>');
        ast.Name = true;
    } else {
        this.match('</');
        ast.Name = this.match('QNAME');
        this.skip('spaces');
        this.match('>');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_text := string_content

rules.xml_text = function(ast) {
    var r = this.match( 'string_content', { noesc: true, delim: '<' } );
    //  FIXME: Нужно при вызове this.match('xml_text') проверять,
    //  что следующий символ не '<'. И тогда можно будет убрать этот backtrace().
    if ( r.empty() ) {
        this.backtrace();
    }
    ast.Text = r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_attrs := xml_attr*

rules.xml_attrs = {

    rule: function(ast) {
        var input = this.input;
        while (1) {
            //  Позволяем перевод строки между xml-атрибутами.
            if ( input.isEOL() ) {
                this.match('eol');
            } else if ( this.test('xml_attr') ) {
                ast.add( this.match('xml_attr') );
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

rules.xml_attr = function(ast) {
    ast.Name = this.match('QNAME');
    this.match('=');
    ast.Value = this.match('inline_string');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  Inline expressions
//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_expr := inline_or

rules.inline_expr = {

    rule: function() {
        return this.match('inline_or');
    },

    options: {
        skipper: 'spaces'
    }

};

//  inline_or := inline_and ( '||' inline_or )?

rules.inline_or = function(ast) {
    ast.Left = this.match('inline_and');
    if ( this.test('||') ) {
        ast.Op = this.match('||');
        ast.Right = this.match('inline_or');
    } else {
        return ast.Left;
    }
};

//  inline_and := inline_eq ( '&&' inline_and )?

rules.inline_and = function(ast) {
    ast.Left = this.match('inline_eq');
    if ( this.test('&&') ) {
        ast.Op = this.match('&&');
        ast.Right = this.match('inline_and');
    } else {
        return ast.Left;
    }
};

//  inline_eq := inline_rel ( ( '==' | '!=' ) inline_rel )?

rules.inline_eq = function(ast) {
    ast.Left = this.match('inline_rel');
    var op;
    if (( op = this.testAny( [ '==', '!=' ] ) )) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_rel');
    } else {
        return ast.Left;
    }
};

//  inline_rel := inline_add ( ( '<=' | '<' | '>=' | '>' ) inline_add )?

rules.inline_rel = function(ast) {
    ast.Left = this.match('inline_add');
    var op;
    if (( op = this.testAny( [ '<=', '<', '>=', '>' ] ) )) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_add');
    } else {
        return ast.Left;
    }
};

//  inline_add := inline_mul ( ( '+' | '-' ) inline_add )?

rules.inline_add = function(ast) {
    ast.Left = this.match('inline_mul');
    var op;
    //  FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
    if (( op = this.testAny( [ '+', '-' ] ) )) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_add');
    } else {
        return ast.Left;
    }
};

//  inline_mul := inline_unary ( ( '/' | '*' | '%' ) inline_mul )?

rules.inline_mul = function(ast) {
    ast.Left = this.match('inline_unary');
    var op;
    if (( op = this.testAny( [ '/', '*', '%' ] ) )) {
        ast.Op = this.match(op);
        ast.Right = this.match('inline_mul');
    } else {
        return ast.Left;
    }
};

//  inline_unary := '-' inline_not | inline_not

rules.inline_unary = function(ast) {
    if ( this.test('-') ) {
        ast.Op = this.match('-');
        ast.Left = this.match('inline_not');
    } else {
        return this.match('inline_not');
    }
};

//  inline_not := '!' inline_union | inline_union

rules.inline_not = function(ast) {
    if ( this.test('!') ) {
        ast.Op = this.match('!');
        ast.Left = this.match('inline_not');
    } else {
        return this.match('inline_union');
    }
};

//  inline_union := inline_primary ( '|' inline_union )?

rules.inline_union = function(ast) {
    ast.Left = this.match('inline_primary');
    if ( this.test('|') ) {
        ast.Op = this.match('|');
        ast.Right = this.match('inline_union');
    } else {
        return ast.Left;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_primary := inline_number | inline_string | inline_subexpr | root | jpath | inline_function | inline_var

rules.inline_primary = {

    rule: function(ast) {
        if ( this.test('NUMBER') ) {
            return this.match('inline_number');
        }

        if ( this.testAny( [ '"', "'" ] ) ) {
            return this.match('inline_string');
        }

        var expr;

        if ( this.test('(') ) {
            expr = this.match('inline_subexpr');
        } else if ( this.test('/') ) {
            expr = this.match('root');
        } else if ( this.test('.') ) {
            expr = this.match('jpath');
        } else if ( this.testAll( [ 'QNAME', '(' ] ) ) {
            expr = this.match('inline_function');
        } else if ( this.test('QNAME') ) {
            expr = this.match('inline_var');
        } else {
            this.error('number, string, jpath, variable or function call expected');
        }

        if ( this.testAny( [ '[', '.' ] ) ) {
            expr = ast.make( 'jpath_filter', {
                expr: expr,
                jpath: this.match( 'jpath', { inContext: true } )
            } );
        }

        return expr;
    },

    options: {
        skipper: 'none'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  root := '/'

rules.root = function(ast) {
    this.match('/');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_number := NUMBER

rules.inline_number = function(ast) {
    ast.Value = parseFloat( this.match('NUMBER') );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_string := '"' string_content '"'

rules.inline_string = {

    rule: function(ast, params) {
        var quote = this.matchAny( [ '"', "'" ] );
        if ( this.test(quote) ) {
            //  Отдельно обрабатываем пустую строку.
            ast.Value = ast.make('string_literal', '');
        } else {
            ast.Value = this.match( 'string_content', { noexpr: params.noexpr, noesc: params.noesc, delim: quote } );
        }
        this.match(quote);
    },

    options: {
        skipper: 'none'
    }

};

//  string_content := ...

//  params.noexpr   -- запрещает интерполяцию выражений в строке.
//  params.noesc    -- не нужно учитывать esc-последовательности типа \n, \t и т.д.
//  params.delim    -- задает символ, ограничивающий строковый контент.
rules.string_content = function(ast, params) {
    var input = this.input;

    var s = '';

    while ( input.current() && !this.test(params.delim) ) {
        if ( !params.noexpr && this.test('{') ) {
            if ( this.test('{{') ) {
                this.match('{{');
                s += '{';
            } else if ( this.test('}}') ) {
                this.match('}}');
                s += '}';

            } else if ( this.test('{') ) {
                if (s) {
                    ast.add( ast.make('string_literal', s) );
                    s = '';
                }
                this.match('{');
                this.skip('spaces');
                ast.add( ast.make( 'string_expr', this.match('inline_expr') ) );
                this.skip('spaces');
                this.match('}');
            }
        } else if ( !params.noesc && this.test('\\') ) {
            this.match('\\');
            if ( this.test('ESC') ) {
                var c = this.match('ESC');
                switch (c) {
                    case 'n': s += '\n'; break;
                    case 't': s += '\t'; break;
                    default: s += c;
                }
            }

        } else {
            s += input.current(1);
            input.next(1);
        }
    }

    if (s) {
        ast.add( ast.make('string_literal', s) );
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_subexpr := '(' inline_expr ')'

rules.inline_subexpr = {

    rule: function(ast) {
        this.match('(');
        ast.Expr = this.match('inline_expr');
        this.match(')');
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_var := QNAME

rules.inline_var = function(ast) {
    ast.Name = this.match('QNAME');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_function := QNAME callargs

rules.inline_function = function(ast) {
    ast.Name = this.match('QNAME');
    ast.Args = this.match('callargs');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  JPath
//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := jpath_steps

rules.jpath = {

    rule: function(ast, params) {
        if (params.inContext) {
            //  inContext означает, что это не полный jpath. Например, в выражении foo[42].bar это [42].bar.
            ast.InContext = true;
        } else {
            if ( !this.test('.') ) {
                // Полный jpath всегда должен начинаться с точки.
                this.error('Expected .');
            }
        }
        ast.Steps = this.match('jpath_steps');
    },

    options: {
        skipper: 'none'
    }

};

//  jpath_steps := jpath_step+

rules.jpath_steps = function(ast) {
    ast.add( this.match('jpath_step') );
    while ( this.test('jpath_step') ) {
        ast.add( this.match('jpath_step') );
    }
};

//  jpath_step := jpath_dots | jpath_nametest | jpath_predicate

rules.jpath_step = function() {
    var r;

    if ( this.test('DOTS') ) {
        r = this.match('jpath_dots');
    } else if ( this.test('.') ) {
        r = this.match('jpath_nametest');
    } else if ( this.test('[') ) {
        r = this.match('jpath_predicate');
    } else {
        this.error('Expected: . or [');
    }

    return r;
};

//  jpath_parents := '.'+

rules.jpath_dots = function(ast) {
    ast.Dots = this.match('DOTS');
    //  FIXME: Не получается одни регэкспом различить ...foo и ...
    //  Точнее различить-то мы их можем.
    //  Но в первом случае мы получаем две точки, во втором -- три,
    //  но в обоих случаях нужно сделать два шага вверх.
    //  Поэтому смотрим, если дальше осталась точка, то добавляем одну точку.
    if ( this.test('.') ) {
        ast.Dots += '.';
    }
};

//  jpath_nametest := '.' ( QNAME | '*' )

rules.jpath_nametest = function(ast) {
    this.match('.');
    ast.Name = this.matchAny( [ 'QNAME', '*' ] );
};

//  jpath_predicate := '[' inline_expr ']'

rules.jpath_predicate = {

    rule: function(ast) {
        this.match('[');
        ast.Expr = this.match('inline_expr');
        this.match(']');
    },

    options: {
        skipper: 'spaces'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Skippers
//  ---------------------------------------------------------------------------------------------------------------  //

grammar.skippers = {};

//  ---------------------------------------------------------------------------------------------------------------  //

grammar.skippers.default_ = function() {
    var r = false;
    while (1) {
        var l = this.skip('spaces') || this.skip('inlineComments') || this.skip('blockComments');
        r = r || l;
        if (!l) { break; }
    }
    return r;
};

grammar.skippers.spaces = /^\ +/;

grammar.skippers.none = function() {};

grammar.skippers.inlineComments = function() {
    var input = this.input;

    if ( input.isEOF() ) { return; }

    if (input.current(2) != '//') {
        return;
    }

    input.next( input.current().length );

    return true;
};

grammar.skippers.blockComments = function() {
    var input = this.input;

    if ( input.isEOF() ) { return; }

    if (input.current(2) === '/*') {

        input.next(2);
        while ( !input.isEOF() ) {
            var i = input.current().indexOf('*/');
            if (i == -1) {
                input.nextLine();
            } else {
                input.next(i);
                break;
            }
        }
        if (input.current(2) != '*/') {
            this.error('Expected */');
        }
        input.next(2);

    } else if (input.current(4) === '<!--') {
        //  FIXME: Зловещий копипаст!

        input.next(4);
        while ( !input.isEOF() ) {
            var i = input.current().indexOf('-->');
            if (i == -1) {
                input.nextLine();
            } else {
                input.next(i);
                break;
            }
        }
        if (input.current(3) != '-->') {
            this.error('Expected -->');
        }
        input.next(3);

    } else {
        return false;
    }

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = new Grammar(grammar);

//  ---------------------------------------------------------------------------------------------------------------  //

