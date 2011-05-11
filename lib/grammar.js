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
    ESC: /^["'\\nt]/,
    NUMBER: /^[0-9]+(\.[0-9]+)?/,
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
    'function',
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
        ast.$body = this.match('block');

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
    while (!( this.isEOF() || this.testAny([ '}', ')' ]) )) { // Блок верхнего уровня (stylesheet) заканчивается с концом файла.
                                                              // Вложенные блоки заканчиваются закрывающей скобкой '}' или ')'.
        if (this.isEOL()) { // Пропускаем пустые строки.
            this.eol();
            continue;
        }

        if (this.test('MATCH')) {
            ast.$templates.add( this.match('template') );
        } else if (this.test('FUNCTION')) {
            ast.$defs.add( this.match('function_') );
        } else if (this.test('KEY')) {
            ast.$defs.add( this.match('key') );
        } else if (this.testAll([ 'QNAME', '=' ])) {
            ast.$defs.add( this.match('var_') );
        } else {
            ast.$exprs.add( this.match('blockExpr') );
        }

        if (!this.isEOL()) { // Если после выражения или определения нет перевода строки, то это конец блока.
            break;
        }
        this.eol();
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// body = '{' block '}' | expr

Yate.Grammar.rules.body = function() {
    if (this.test('{')) {
        this.match('{');
        var body = this.match('block');
        this.match('}');
        return body;
    } else {
        var expr = this.match('blockExpr');
        return Yate.AST.make('block', expr);
    }
};


// ----------------------------------------------------------------------------------------------------------------- //
// Declarations: templates, functions, keys, vars
// ----------------------------------------------------------------------------------------------------------------- //

// template = 'match' jpath ( argList )? ( templateMode )? body

Yate.Grammar.rules.template = function(ast) {
    this.match('MATCH');
    ast.$jpath = this.match('jpath');
    if (this.test('(')) {
        ast.$args = this.match('argList');
    }
    ast.$mode = this.match('templateMode')
    ast.$body = this.match('body');
};

// templateMode = ':' QNAME | ''

Yate.Grammar.rules.templateMode = function(ast) {
    if (this.test(':')) {
        this.match(':');
        ast.$value = this.match('QNAME');
    } else {
        ast.$value = '';
    }
};

// argList = '(' ( argListItem ( ',' argListItem )* )? ')'

Yate.Grammar.rules.argList = function(ast) {
    this.match('(');
    if (this.test('argListItem')) {
        ast.add(this.match('argListItem'));
        while (this.test(',')) {
            this.match(',');
            ast.add(this.match('argListItem'));
        }
    }
    this.match(')');
};

// argListItem = ( 'nodeset', 'boolean', 'scalar' )? QNAME ( '=' inlineExpr )?

Yate.Grammar.rules.argListItem = function(ast) {
    var r;
    if (r = this.testAny([ 'NODESET', 'BOOLEAN', 'SCALAR' ])) {
        ast.$typedef = this.match(r);
    }
    ast.$name = this.match('QNAME');
    if (this.test('=')) {
        this.match('=');
        ast.$default = this.match('inlineExpr');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// function_ = 'function' QNAME argList body

Yate.Grammar.rules.function_ = function(ast) {
    this.match('FUNCTION');
    var name = ast.$name = this.match('QNAME');
    ast.$args = this.match('argList');
    ast.$body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// key = 'key' QNAME '(' inlineExpr ',' inlineExpr ')' body

Yate.Grammar.rules.key = function(ast) {
    this.match('KEY');
    ast.$name = this.match('QNAME');
    this.match('(');
    ast.$nodes = this.match('inlineExpr');
    this.match(',');
    ast.$use = this.match('inlineExpr');
    this.match(')');
    ast.$body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// var_ = QNAME '=' expr

Yate.Grammar.rules.var_ = function(ast) {
    ast.$name = this.match('QNAME');
    this.match('=');
    var value = this.match('blockExpr');
    ast.$value = (value.is('inlineList')) ? value : Yate.AST.make('block', value); // FIXME: А нужно ли это тут?
};


// ----------------------------------------------------------------------------------------------------------------- //
// Block expressions
// ----------------------------------------------------------------------------------------------------------------- //

// blockExpr = if_ | for_ | apply | xmlLine | attr | blockComplex | inlineList

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
    } else if (this.test('inlineList')) {
        r = this.match('inlineList');
    } else if (this.test('(')) {
        r = this.match('blockComplex');
    }

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

// if_ = 'if' '(' inlineExpr ')' body ( 'else' body )?

Yate.Grammar.rules.if_ = function(ast) {
    this.match('IF');
    this.match('('); // FIXME: Нужно убрать эти скобки.
    ast.$condition = this.match('inlineExpr');
    this.match(')');
    ast.$then = this.match('body');
    if (this.test('ELSE')) {
        this.match('ELSE');
        ast.$else = this.match('body');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// for_ = 'for' '(' inlineExpr ')' body

Yate.Grammar.rules.for_ = function(ast) {
    this.match('FOR');
    this.match('('); // FIXME: Нужно убрать эти скобки.
    ast.$expr = this.match('inlineExpr');
    this.match(')');
    ast.$body = this.match('body');
};

// ----------------------------------------------------------------------------------------------------------------- //

// apply = 'apply' inlineExpr ( callArgs )? ( templateMode )?

Yate.Grammar.rules.apply = function(ast) {
    this.match('APPLY');
    ast.$expr = this.match('inlineExpr');
    if (this.test('(')) {
        ast.$args = this.match('callArgs');
    }
    ast.$mode = this.match('templateMode');
};

// callArgs = '(' ( inlineExpr ( ',' inlineExpr )* )? ')'

Yate.Grammar.rules.callArgs = function(ast) {
    this.match('(');
    if (this.test('inlineExpr')) {
        ast.add( this.match('inlineExpr') );
        while (this.test(',')) {
            this.match(',');
            ast.add( this.match('inlineExpr') );
        }
    }
    this.match(')');
};

// ----------------------------------------------------------------------------------------------------------------- //

// attr = '@' QNAME ( '=' | '+=' ) expr

Yate.Grammar.rules.attr = function(ast) {
    this.match('@');
    ast.$name = this.match('QNAME');
    var r;
    if (r = this.testAny([ '+=', '=' ])) {
        ast.$op = this.match(r);
        ast.$expr = this.match('blockExpr');
    } else {
        this.error('"=" or "+=" expected');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// blockComplex = '(' block ')'

Yate.Grammar.rules.blockComplex = function(ast) {
    this.match('(');
    ast.$body = this.match('block');
    this.match(')');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineList = inlineExpr ( ',' inlineExpr )*

Yate.Grammar.rules.inlineList = function(ast) {
    ast.add( this.match('inlineExpr') );
    while (this.test(',')) {
        this.match(',');
        ast.add( this.match('inlineExpr') );
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

    if (start.$name != end.$name) {
        this.error('XML is not well-formed');
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlStart = '<' QNAME ( xmlAttrs )? '>'

Yate.Grammar.rules.xmlStart = function(ast) {
    this.match('<');
    ast.$name = this.match('QNAME');
    ast.$attrs = this.match('xmlAttrs');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlEmpty = '<' QNAME ( xmlAttrs )? '/>'

Yate.Grammar.rules.xmlEmpty = function(ast) {
    this.match('<');
    ast.$name = this.match('QNAME');
    ast.$attrs = this.match('xmlAttrs');
    this.match('/>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlEnd = '</' QNAME '>'

Yate.Grammar.rules.xmlEnd = function(ast) {
    this.match('</');
    ast.$name = this.match('QNAME');
    this.skip('spaces');
    this.match('>');
};

// ----------------------------------------------------------------------------------------------------------------- //

// xmlText = stringContent

Yate.Grammar.rules.xmlText = function(ast) {
    var r = this.match('stringContent', '<');
    if (r.empty()) {
        this.error('No xmlText here');
    }
    ast.$text = r;
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
    ast.$name = this.match('QNAME');
    this.match('=');
    ast.$value = this.match('inlineString');
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
    ast.$left = this.match('inlineAnd');
    if (this.test('||')) {
        ast.$op = this.match('||');
        ast.$right = this.match('inlineOr');
    } else {
        return ast.$left;
    }
};

// inlineAnd = inlineEq ( '&&' inlineAnd )?

Yate.Grammar.rules.inlineAnd = function(ast) {
    ast.$left = this.match('inlineEq');
    if (this.test('&&')) {
        ast.$op = this.match('&&');
        ast.$right = this.match('inlineAnd');
    } else {
        return ast.$left;
    }
};

// inlineEq = inlineRel ( ( '==' | '!=' ) inlineRel )?

Yate.Grammar.rules.inlineEq = function(ast) {
    ast.$left = this.match('inlineRel');
    var op;
    if (op = this.testAny([ '==', '!=' ])) {
        ast.$op = this.match(op);
        ast.$right = this.match('inlineRel');
    } else {
        return ast.$left;
    }
};

// inlineRel = inlineAdd ( ( '<=' | '<' | '>=' | '>' ) inlineAdd )?

Yate.Grammar.rules.inlineRel = function(ast) {
    ast.$left = this.match('inlineAdd');
    var op;
    if (op = this.testAny([ '<=', '<', '>=', '>' ])) {
        ast.$op = this.match(op);
        ast.$right = this.match('inlineAdd');
    } else {
        return ast.$left;
    }
};

// inlineAdd = inlineMul ( ( '+' | '-' ) inlineAdd )?

Yate.Grammar.rules.inlineAdd = function(ast) {
    ast.$left = this.match('inlineMul');
    var op;
    if (op = this.testAny([ '+', '-' ])) { // FIXME: Проблемы с порядком выполнения. Например, 1 - 2 - 3 превратится в -(1, -(2, 3)).
        ast.$op = this.match(op);
        ast.$right = this.match('inlineAdd');
    } else {
        return ast.$left;
    }
};

// inlineMul = inlineUnary ( ( '/' | '*' | '%' ) inlineMul )?

Yate.Grammar.rules.inlineMul = function(ast) {
    ast.$left = this.match('inlineUnary');
    var op;
    if (op = this.testAny([ '/', '*', '%' ])) {
        ast.$op = this.match(op);
        ast.$right = this.match('inlineMul');
    } else {
        return ast.$left;
    }
};

// inlineUnary = '-' inlineNot | inlineNot

Yate.Grammar.rules.inlineUnary = function(ast) {
    if (this.test('-')) {
        ast.$op = this.match('-');
        ast.$left = this.match('inlineNot');
    } else {
        return this.match('inlineNot');
    }
};

// inlineNot = '!' inlineUnion | inlineUnion

Yate.Grammar.rules.inlineNot = function(ast) {
    if (this.test('!')) {
        ast.$op = this.match('!');
        ast.$left = this.match('inlineUnion');
    } else {
        return this.match('inlineUnion');
    }
};

// inlineUnion = inlinePrimary ( '|' inlineUnion )?

Yate.Grammar.rules.inlineUnion = function(ast) {
    ast.$left = this.match('inlinePrimary');
    if (this.test('|')) {
        ast.$op = this.match('|');
        ast.$right = this.match('inlineUnion');
    } else {
        return ast.$left;
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlinePrimary = inlineNumber | inlineString | inlineComplex | inlineVar | inlineFunction | jpath

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
        } else if (this.test('$')) {
            expr = this.match('inlineVar');
        } else if (this.test('inlineFunction')) {
            expr = this.match('inlineFunction');
        } else {
            expr = this.match('jpath');
        }

        // FIXME: Вот тут может быть сколько угодно продолжений вида /..., [...], {...}.
        //        Пока что для разгону только по одной штуке.

        if (this.test('[')) {
            expr = Yate.AST.make('inlineGrep', expr, this.match('predicate'));
        }

        if (this.test('/')) {
            var jpath = this.match('jpath');
            if (!jpath.$steps) {
                this.error('ERROR'); // FIXME
            }
            jpath.$context = expr;
            jpath.$absolute = false;

            expr = jpath;
        }

        if (this.test('{')) {
            this.match('{'); // FIXME: Запихнуть это в отдельное правило index.
            expr = Yate.AST.make('inlineIndex', expr, this.match('inlineExpr'));
            this.match('}');
        }

        return expr;
    },

    options: {
        skipper: 'none'
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineNumber = NUMBER

Yate.Grammar.rules.inlineNumber = function(ast) {
    ast.$value = this.match('NUMBER');
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Grammar.rules.inlineString = {

    rule: function(ast) {
        this.match('"');
        ast.$value = this.match('stringContent', '"', true);
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
            this.match('{'); // FIXME: matchAll([ '{', 'inlineExpr', '}' ], { skipper: 'spaces' });
            this.skip('spaces');
            ast.add( Yate.AST.make('stringExpr', this.match('inlineExpr')) );
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

// inlineComplex = '(' inlineExpr ')'

Yate.Grammar.rules.inlineComplex = {

    rule: function(ast) {
        this.match('(');
        ast.$expr = this.match('inlineExpr');
        this.match(')');
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineVar = '$' QNAME

Yate.Grammar.rules.inlineVar = function(ast) {
    this.match('$');
    ast.$name = this.match('QNAME');
};

// ----------------------------------------------------------------------------------------------------------------- //

// inlineFunction = QNAME callArgs

Yate.Grammar.rules.inlineFunction = function(ast) {
    ast.$name = this.match('QNAME');
    ast.$args = this.match('callArgs');
};


// ----------------------------------------------------------------------------------------------------------------- //
// JPath
// ----------------------------------------------------------------------------------------------------------------- //

// jpath = '/' | ( '/' )? jpathSteps

Yate.Grammar.rules.jpath = {

    rule: function(ast) {
        ast.$absolute = (this.test('/')) ? this.match('/') : '';

        if (this.test('jpathSteps')) {
            ast.$steps = this.match('jpathSteps');
        } else {
            if (!ast.$absolute) { // Только один jpath не имеет steps: /
                this.error("jpath expected");
            }
        }
    },

    options: {
        skipper: 'none'
    }

};

// jpathSteps = jpathStep ( '/' jpathStep )*

Yate.Grammar.rules.jpathSteps = function(ast) {
    ast.add( this.match('jpathStep') );
    while (this.test('/')) {
        this.match('/');
        ast.add( this.match('jpathStep') );
    }
};

// jpathStep = '.' | '..' | ( '*' | QNAME ) predicate?

Yate.Grammar.rules.jpathStep = function(ast) {
    var r;
    if ((r = this.testAny([ '..', '.', '*' ]))) {
        ast.$name = this.match(r);
    } else {
        ast.$name = this.match('QNAME');
    }

    if (ast.$name != '.' && ast.$name != '..') {
        if (this.test('[')) { // FIXME: Предикатов может быть несколько.
            ast.$predicate = this.match('predicate');
        }
    }
};

// predicate = '[' inlineExpr ']'

Yate.Grammar.rules.predicate = {

    rule: function(ast) {
        this.match('[');
        ast.$expr = this.match('inlineExpr');
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

