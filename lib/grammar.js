var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

var pt = require('parse-tools');

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
    DOTS: /^(?:\.{2,}(?=\.['"a-zA-Z0-9_*])|\.+(?!['"a-zA-Z0-9_*]))/,
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

    rule: function(p, a) {
        p.Name = this.match('module_name');
        p.Block = this.match( 'block', { toplevel: true } );

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

    return '';
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  block := ( import | include | template | function_ | key | var_ | block_expr )*

rules.block = function(p, a, params) {
    var that = this;

    var input = this.input;

    var Items = p.Items;

    //  Блок верхнего уровня (module) заканчивается с концом файла.
    //  Вложенные блоки заканчиваются закрывающей скобкой '}', ']' или ')'.
    while ( !( input.isEOF() || this.testAny('}', ']', ')') ) ) {
        //  Пропускаем пустые строки.
        if ( input.isEOL() ) {
            this.match('eol');
            continue;
        }

        var r = null;
        if ( this.test('IMPORT') ) {
            checktop();
            Items.add( this.match('import') );

        } else if ( this.test('INCLUDE') ) {
            Items.add( this.match('include') );

        } else if ( this.test('MATCH') ) {
            checktop();
            Items.add( this.match('template') );

        } else if ( this.test('KEY') ) {
            checktop();
            Items.add( this.match('key') );

        } else if ( this.test('FUNC') ) {
            Items.add( this.match('function_') );

        } else if ( this.test('EXTERNAL') ) {
            checktop();
            Items.add( this.match('external') );

        } else if ( this.testAll('QNAME', '=') ) {
            Items.add( this.match('var_') );

        } else {
            Items.add( this.match('block_expr') );

        }

        //  Если после выражения или определения нет перевода строки, то это конец блока.
        if ( !input.isEOL() ) {
            break;
        }

        this.match('eol');
    }

    function checktop() {
        if (!params.toplevel) {
            that.error('"match", "include", "import", "key" and "external" aren\'t allowed in blocks');
        }
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  body := '{' block '}' | '[' block ']'

rules.body = function(p, a) {
    //  Блоки бывают двух видов. Обычные { ... } и со списочным контекстом [ ... ].
    //  В [ ... ] каждое выражение верхнего уровня генерит отдельный элемент списка.
    var start = this.testAny('{', '[');
    if (start) {
        this.match(start);

        p.Block = this.match('block');
        /*
        if (start == '[') {
            p.AsList = true;
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

rules.import = function(p, a) {
    this.match('IMPORT');
    p.Name = this.match( 'inline_string', { noexpr: true } ).asString();
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  include := 'include' inline_string

rules.include = function(p, a) {
    this.match('INCLUDE');

    var filename = this.match( 'inline_string', { noexpr: true } ).asString();
    var dirname = path_.dirname(this.input.filename);

    p.Filename = path_.resolve(dirname, filename);
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Declarations: templates, functions, keys, vars
//  ---------------------------------------------------------------------------------------------------------------  //

//  template := 'match' jpath ( '|' jpath )* template_mode? arglist? body

rules.template = function(p, a) {
    this.match('MATCH');
    p.Selectors = this.match('template_selectors');

    p.Mode = this.match('template_mode');
    if ( this.test('(') ) {
        p.Args = this.match('arglist');
    }
    p.Body = this.match('body');
};

rules.template_selectors = function(p, a) {
    a.add( this.match('jpath') );
    while ( this.test('|') ) {
        this.match('|');
        a.add( this.match('jpath') );
    }
};

//  template_mode := QNAME

rules.template_mode = function(p, a) {
    if ( this.test('QNAME') ) {
        p.Value = this.match('QNAME');
    } else {
        p.Value = '';
    }
};

//  arglist := '(' arglist_item ( ',' arglist_item )* ')'

rules.arglist = function(p, a) {
    this.match('(');
    if ( this.test('arglist_item') ) {
        a.add( this.match('arglist_item') );
        while ( this.test(',') ) {
            this.match(',');
            a.add( this.match('arglist_item') );
        }
    }
    this.match(')');
};

//  arglist_item := ( 'nodeset', 'boolean', 'scalar' )? QNAME ( '=' inline_expr )?

rules.arglist_item = function(p, a) {
    if ( this.test('typedef') ) {
        p.Typedef = this.match('typedef');
    }
    p.Name = this.match('QNAME');
    if ( this.test('=') ) {
        this.match('=');
        p.Default = this.match('inline_expr');
    }
};

rules.typedef = function() {
    return this.matchAny('NODESET', 'BOOLEAN', 'SCALAR', 'ATTR', 'XML', 'OBJECT', 'ARRAY');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  function_ := 'func' QNAME arglist body

rules.function_ = function(p, a) {
    this.match('FUNC');
    p.Name = this.match('QNAME');
    p.Args = this.match('arglist');
    p.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  external := 'external' typedef QNAME argtypes

rules.external = function(p, a) {
    this.match('EXTERNAL');
    p.Type = this.match('typedef');
    p.Name = this.match('QNAME');
    p.ArgTypes = this.match('argtypes');
};

// argtypes := '(' ( typedef ( ',' typedef )* )? ')'

rules.argtypes = function() {
    var types = [];

    this.match('(');
    if ( this.test('typedef') ) {
        //  FIXME: Сделать не массив, а items.
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

rules.key = function(p, a) {
    this.match('KEY');
    p.Name = this.match('QNAME');
    this.match('(');
    p.Nodes = this.match('inline_expr');
    this.match(',');
    p.Use = this.match('inline_expr');
    this.match(')');
    p.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  var_ := QNAME '=' block_expr

rules.var_ = function(p, a) {
    p.Name = this.match('QNAME');
    this.match('=');
    p.Value = this.match('block_expr');
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
    } else if ( this.test(':::') ) {
        r = this.match('cdata');
    } else if ( this.test('@') ) {
        r = this.match('attr');
    } else if ( this.test('<') ) {
        r = this.match('xml_line');
    } else if ( this.test('[') ) {
        r = this.match('array');
    } else if ( this.test('{') ) {
        r = this.match('object');
    } else if ( this.testAll('inline_string', ':') ) {
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

//  if_ := 'if' multiline_expr body else_if* else_?

rules.if_ = function(p, a) {
    this.match('IF');
    p.Condition = this.match('multiline_expr');
    p.Then = this.match('body');
    var Elses = p.Elses;
    while ( this.test('ELSE IF') ) {
        Elses.add( this.match('else_if') );
    }
    if ( this.test('ELSE') ) {
        Elses.add( this.match('else_') );
    }
};

//  else_if := 'else if' multiline_expr body

rules.else_if = function(p, a) {
    this.match('ELSE IF');
    p.Condition = this.match('multiline_expr');
    p.Body = this.match('body');
};

//  else_ := 'else' body

rules.else_ = function(p, a) {
    this.match('ELSE');
    p.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  for_ := 'for' multiline_expr body

rules.for_ = function(p, a) {
    this.match('FOR');
    p.Selector = this.match('multiline_expr');
    p.Body = this.match('body');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  apply := 'apply' ( inline_expr | array | object ) template_mode? callargs?

rules.apply = function(p, a) {
    this.match('APPLY');

    if ( this.test('{') ) {
        p.Expr = this.match('object');
    } else if ( this.test('[') ) {
        p.Expr = this.match('array');
    } else {
        p.Expr = this.match('inline_expr');
    }
    /*
    var r = this.testAny('inline_expr', 'array', 'object');
    if (!r) {
        this.error('Expected expr');
    }

    p.Expr = this.match(r);
    */

    p.Mode = this.match('template_mode');
    if ( this.test('(') ) {
        p.Args = this.match('callargs');
    }
};

//  callargs := '(' ( callarg ( ',' callarg )* )? ')'

rules.callargs = function(p, a) {
    this.match('(');
    if ( !this.test(')') ) {
        a.add( this.match('callarg') );
        while ( this.test(',') ) {
            this.match(',');
            a.add( this.match('callarg') );
        }
    }
    this.match(')');
};

//  callarg := object | array | multiline_expr

rules.callarg = {
    rule: function(p, a) {
        if ( this.test('{') ) {
            p.Expr = this.match('object');
        } else if ( this.test('[') ) {
            p.Expr = this.match('array');
        } else {
            p.Expr = this.match('multiline_expr');
        }
    },

    options: {
        skipper: 'spaces'
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  attr := '@' QNAME ( '=' | '+=' ) block_expr

rules.attr = function(p, a) {
    this.match('@');

    p.Name = this.match('string_content', { noesc: true, delim: 'ATTR_END' });

    var r;
    if (( r = this.testAny('+=', '=') )) {
        p.Op = this.match(r);
        p.Value = this.match('block_expr');
    } else {
        this.error('"=" or "+=" expected');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  array := '[' block ']'

rules.array = function(p, a) {
    //  FIXME: Поддержать инлайновый вариант: [ 1, 2, 3 ].
    this.match('[');
    p.Block = this.match('block');
    this.match(']');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  object := '{' block '}'

rules.object = function(p, a) {
    //  FIXME: Поддержать инлайновый вариант: { "foo": 42, "bar": 24 }.
    this.match('{');
    p.Block = this.match('block');
    this.match('}');
};


//  ---------------------------------------------------------------------------------------------------------------  //

//  pair := inline_expr ':' block_expr

rules.pair = function(p, a) {
    p.Key = this.match('inline_expr');
    this.match(':');
    p.Value = this.match('block_expr');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  subexpr := '(' block ')'

rules.subexpr = function(p, a) {
    this.match('(');
    p.Block = this.match('block');
    this.match(')');
};

//  ---------------------------------------------------------------------------------------------------------------  //

rules.value = function(p, a) {
    p.Value = this.match('inline_expr');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  XML
//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_line := (xml_full | xml_empty | xml_start | xml_end)+

rules.xml_line = {

    rule: function(p, a) {
        var r;
        while (( r = this.testAny('xml_full', 'xml_empty', 'xml_start', 'xml_end') )) {
            a.add( this.match(r) );
        }
    },

    options: {
        skipper: 'none'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_full := xml_start ( xml_full | xml_empty | xml_text )* xml_end

rules.xml_full = {
    rule: function(p, a) {
        var start = this.match('xml_start');
        a.add(start);

        var r;
        while (( r = this.testAny('xml_full', 'xml_empty', 'xml_text') )) {
            a.add( this.match(r) );
        }

        var end = this.match('xml_end');
        a.add(end);

        //  FIXME: Унести это куда-то в .action().
        if (end.p.Name === true) {
            end.p.Name = start.p.Name;
        }

        if (start.p.Name != end.p.Name) {
            this.backtrace();
        }
    },

    options: {
        skipper: 'htmlBlockComments'
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_start := '<' QNAME ( xml_attrs )? '>'

rules.xml_start = function(p, a) {
    this.match('<');
    p.Name = this.match('QNAME');
    p.Attrs = this.match('xml_attrs');
    this.match('>');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_empty := '<' QNAME ( xml_attrs )? '/>'

rules.xml_empty = function(p, a) {
    this.match('<');
    p.Name = this.match('QNAME');
    p.Attrs = this.match('xml_attrs');
    this.match('/>');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_end := '</' QNAME '>'

rules.xml_end = function(p, a) {
    if ( this.test('</>') ) {
        this.match('</>');
        p.Name = true;
    } else {
        this.match('</');
        p.Name = this.match('QNAME');
        this.skip('spaces');
        this.match('>');
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_text := string_content

rules.xml_text = function(p, a) {
    var r = this.match( 'string_content', { noesc: true, delim: '<' } );
    //  FIXME: Нужно при вызове this.match('xml_text') проверять,
    //  что следующий символ не '<'. И тогда можно будет убрать этот backtrace().
    if ( r.empty() ) {
        this.backtrace();
    }
    p.Text = r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  xml_attrs := xml_attr*

rules.xml_attrs = {

    rule: function(p, a) {
        var input = this.input;
        while (1) {
            //  Позволяем перевод строки между xml-атрибутами.
            if ( input.isEOL() ) {
                this.match('eol');
            } else if ( this.test('xml_attr') ) {
                a.add( this.match('xml_attr') );
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

rules.xml_attr = function(p, a) {
    p.Name = this.match('QNAME');
    this.match('=');
    p.Value = this.match('inline_string');
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

rules.multiline_expr = {

    rule: function() {
        return this.match('inline_or');
    },

    options: {
        skipper: 'whitespaces'
    }

};

//  inline_or := inline_and ( '||' inline_or )?

rules.inline_or = function(p, a) {
    p.Left = this.match('inline_and');
    if ( this.test('||') ) {
        p.Op = this.match('||');
        p.Right = this.match('inline_or');
    } else {
        return p.Left;
    }
};

//  inline_and := inline_eq ( '&&' inline_and )?

rules.inline_and = function(p, a) {
    p.Left = this.match('inline_eq');
    if ( this.test('&&') ) {
        p.Op = this.match('&&');
        p.Right = this.match('inline_and');
    } else {
        return p.Left;
    }
};

//  inline_eq := inline_rel ( ( '==' | '!=' ) inline_rel )?

rules.inline_eq = function(p, a) {
    p.Left = this.match('inline_rel');
    var op;
    if (( op = this.testAny('==', '!=') )) {
        p.Op = this.match(op);
        p.Right = this.match('inline_rel');
    } else {
        return p.Left;
    }
};

//  inline_rel := inline_add ( ( '<=' | '<' | '>=' | '>' ) inline_add )?

rules.inline_rel = function(p, a) {
    p.Left = this.match('inline_add');
    var op;
    if (( op = this.testAny('<=', '<', '>=', '>') )) {
        p.Op = this.match(op);
        p.Right = this.match('inline_add');
    } else {
        return p.Left;
    }
};

//  inline_add := inline_mul ( ( '+' | '-' ) inline_add )?

rules.inline_add = function(p, a) {
    p.Left = this.match('inline_mul');
    var op;
    //  FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
    if (( op = this.testAny('+', '-') )) {
        p.Op = this.match(op);
        p.Right = this.match('inline_add');
    } else {
        return p.Left;
    }
};

//  inline_mul := inline_unary ( ( '/' | '*' | '%' ) inline_mul )?

rules.inline_mul = function(p, a) {
    p.Left = this.match('inline_unary');
    var op;
    if (( op = this.testAny('/', '*', '%') )) {
        p.Op = this.match(op);
        p.Right = this.match('inline_mul');
    } else {
        return p.Left;
    }
};

//  inline_unary := '-' inline_not | inline_not

rules.inline_unary = function(p, a) {
    if ( this.test('-') ) {
        p.Op = this.match('-');
        p.Left = this.match('inline_not');
    } else {
        return this.match('inline_not');
    }
};

//  inline_not := '!' inline_union | inline_union

rules.inline_not = function(p, a) {
    if ( this.test('!') ) {
        p.Op = this.match('!');
        p.Left = this.match('inline_not');
    } else {
        return this.match('inline_union');
    }
};

//  inline_union := inline_primary ( '|' inline_union )?

rules.inline_union = function(p, a) {
    p.Left = this.match('inline_primary');
    if ( this.test('|') ) {
        p.Op = this.match('|');
        p.Right = this.match('inline_union');
    } else {
        return p.Left;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_primary := inline_number | inline_string | inline_subexpr | jpath | inline_function | inline_var

rules.inline_primary = {

    rule: function(p, a) {
        if ( this.test('NUMBER') ) {
            return this.match('inline_number');
        }

        if ( this.testAny('"', "'") ) {
            return this.match('inline_string');
        }

        var expr;

        if ( this.test('(') ) {
            expr = this.match('inline_subexpr');
        } else if ( this.testAny('.', '/') ) {
            expr = this.match('jpath');
        } else if ( this.testAll('SORT', '(') ) {
            expr = this.match('sort');
        } else if ( this.testAll('QNAME', '(') ) {
            expr = this.match('inline_function');
        } else if ( this.test('QNAME') ) {
            expr = this.match('inline_var');
        } else {
            this.error('number, string, jpath, variable or function call expected');
        }

        if ( this.testAny('[', '.') ) {
            //  FIXME: А не нужно ли тут написать expr.make и убрать параметры p и a?
            expr = a.make( 'jpath_filter', {
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

rules.sort = {

    rule: function(p, a) {
        this.match('SORT');
        this.match('(');
        p.Nodes = this.match('inline_expr');
        this.match(',');
        if ( this.testAny('ASC', 'DESC') ) {
            p.Order = this.matchAny('ASC', 'DESC');
        } else {
            p.Order = 'asc';
        }
        p.By = this.match('inline_expr');
        this.match(')');
    },

    options: {
        skipper: 'default_'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_number := NUMBER

rules.inline_number = function(p, a) {
    p.Value = parseFloat( this.match('NUMBER') );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_string := '"' string_content '"'

rules.inline_string = {

    rule: function(p, a, params) {
        var quote = this.matchAny('"', "'");
        if ( this.test(quote) ) {
            //  Отдельно обрабатываем пустую строку.
            p.Value = a.make('string_literal', '');
        } else {
            p.Value = this.match( 'string_content', { noexpr: params.noexpr, noesc: params.noesc, delim: quote } );
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
rules.string_content = function(p, a, params) {
    var input = this.input;

    var s = '';

    while ( input.current() && !this.test(params.delim) ) {
        if ( !params.noexpr && this.testAny('{', '}') ) {
            if ( this.test('{{') ) {
                this.match('{{');
                s += '{';
            } else if ( this.test('}}') ) {
                this.match('}}');
                s += '}';

            } else if ( this.test('{') ) {
                if (s) {
                    a.add( a.make('string_literal', s) );
                    s = '';
                }
                this.match('{');
                this.skip('spaces');
                a.add( a.make( 'string_expr', this.match('inline_expr') ) );
                this.skip('spaces');
                this.match('}');
            } else {
                this.error('Unmatched }');
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
        a.add( a.make('string_literal', s) );
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_subexpr := '(' inline_expr ')'

rules.inline_subexpr = {

    rule: function(p, a) {
        this.match('(');
        p.Expr = this.match('inline_expr');
        this.match(')');
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_var := QNAME

rules.inline_var = function(p, a) {
    p.Name = this.match('QNAME');
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  inline_function := QNAME callargs

rules.inline_function = function(p, a) {
    p.Name = this.match('QNAME');
    p.Args = this.match('callargs');
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  JPath
//  ---------------------------------------------------------------------------------------------------------------  //

//  jpath := '/'? jpath_steps

rules.jpath = {

    rule: function(p, a, params) {
        if (params.inContext) {
            //  inContext означает, что это не полный jpath. Например, в выражении foo[42].bar это [42].bar.
            p.InContext = true;
        } else {
            if ( !this.testAny('.', '/') ) {
                // Полный jpath всегда должен начинаться с точки или слэша.
                this.error('Expected . or /');
            }
        }

        //  jpath может начинаться с /, но это должен быть полный jpath, не в контексте.
        if ( !p.InContext && this.test('/') ) {
            this.match('/');
            p.Abs = true;
        } else if ( !this.testAny('.', '[') ) {
            this.error('Expected: . or [');
        }
        p.Steps = this.match('jpath_steps');
    },

    options: {
        skipper: 'none'
    }

};

//  jpath_steps := jpath_step*

rules.jpath_steps = function(p, a) {
    while ( this.test('jpath_step') ) {
        a.add( this.match('jpath_step') );
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

rules.jpath_dots = function(p, a) {
    p.Dots = this.match('DOTS');
    //  FIXME: Не получается одни регэкспом различить ...foo и ...
    //  Точнее различить-то мы их можем.
    //  Но в первом случае мы получаем две точки, во втором -- три,
    //  но в обоих случаях нужно сделать два шага вверх.
    //  Поэтому смотрим, если дальше осталась точка, то добавляем одну точку.
    if ( this.test('.') ) {
        p.Dots += '.';
    }
};

//  jpath_nametest := '.' ( QNAME | '*' )

rules.jpath_nametest = function(p, a) {
    this.match('.');
    if ( this.testAny('"', "'") ) {
        p.Name = this.match( 'inline_string', { noexpr: true, noesc: true } ).asString();
    } else {
        p.Name = this.matchAny('JSTEP', '*');
    }
};

//  jpath_predicate := '[' multiline_expr ']'

rules.jpath_predicate = {

    rule: function(p, a) {
        this.match('[');
        p.Expr = this.match('multiline_expr');
        this.match(']');
    },

    options: {
        skipper: 'spaces'
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

//  cdata := ':::' strings ':::'

rules.cdata = {

    rule: function(p, a) {
        this.match(':::');

        var input = this.input;
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

        this.match(':::');

        var indent = 1000;
        for (var i = 1; i < s.length; i++) {
            indent = Math.min( indent, /^(\s*)/.exec( s[i] )[1].length );
        }

        if (indent) {
            for (var i = 1; i < s.length; i++) {
                s[i] = s[i].substr(indent);
            }
        }

        p.Value = a.make( 'string_literal', s.join('\n') );
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

grammar.skippers.default_ = function() {
    var r = false;
    while (1) {
        var l = this.skip('spaces') || this.skip('inlineComments') || this.skip('jsBlockComments') || this.skip('htmlBlockComments');
        r = r || l;
        if (!l) { break; }
    }
    return r;
};

grammar.skippers.spaces = /^[\ \t]+/;

grammar.skippers.whitespaces = function() {
    var input = this.input;

    this.skip('spaces');
    if ( !input.current() ) {
        input.nextLine();
    }
    this.skip('spaces');
};

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

grammar.skippers.jsBlockComments = function() {
    var input = this.input;

    if ( input.isEOF() ) { return; }

    if (input.current(2) !== '/*') {
        return false;
    }

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

    return true;
};

grammar.skippers.htmlBlockComments = function() {
    var input = this.input;

    if ( input.isEOF() ) { return; }

    if (input.current(4) !== '<!--') {
        return false;
    }

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

    return true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.grammar = new pt.Grammar(grammar);

//  ---------------------------------------------------------------------------------------------------------------  //

