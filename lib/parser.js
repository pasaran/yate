var path_ = require('path');

var grammar = require('./yate.grammar.js');
var factory = require('./yate.factory.js');

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser = function(grammar) {
    this.tokens = {};
    this.rules = {};
    this.skippers = {};

    this.add_tokens(grammar.tokens);
    this.add_keywords(grammar.keywords);
    this.add_rules(grammar.rules);
    this.add_skippers(grammar.skippers);

    this.skipper = null;
    this.cache = {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.read = function(filename) {
    this.filename = path_.resolve(filename);

    var content = fs_.readFileSync(this.filename, 'utf-8');
    //  Strip UTF-8 BOM
    if ( content === '\uFEFF' ) {
        content = content.substr(1);
    }

    this.init(content);

    return this;
};

yate.Parser.prototype.init = function(input) {
    this.lines = input.split('\n');
    this.x = 0;
    this.y = 0;
    this.line = this.lines[0];

    return this;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.current = function(n) {
    var line = this.line;

    return (n && line) ? line.substr(0, n) : line;
};

yate.Parser.prototype.next = function(n) {
    this.x += n;
    this.line = this.line.substr(n);
};

yate.Parser.prototype.nextLine = function(n) {
    this.x = 0;
    this.y += (n || 1);
    this.line = this.lines[this.y];
};

yate.Parser.prototype.is_eol = function() {
    return (this.line === '');
};

yate.Parser.prototype.is_eof = function() {
    return (this.line === undefined);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.where = function() {
    var where = 'at (' + (this.x + 1) + ', ' + (this.y + 1) + ') in ' + this.filename;

    var line = input.lines[this.y] || '';
    where += ':\n' + line + '\n' + Array(this.x + 1).join('-') + '^';

    return where;
};

yate.Parser.prototype.whereKey = function() {
    return this.x + '|' + this.y;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.set_pos = function(pos) {
    var x = this.x = pos.x;
    var y = this.y = pos.y;
    this.line = this.lines[y].substr(x);
};

yate.Parser.prototype.get_pos = function() {
    return {
        x: this.x,
        y: this.y
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.parse = function(rule) {
    return this.match(rule);
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.get_ast = function(id) {
    return factory.make( id, this.input.get_pos() );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Errors
//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.error = function(msg) {
    //  FIXME
    throw new Error( msg || 'Unknown error', this.input.get_pos() );
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.skip = function(id) {
    id = id || this.skipper;
    var skipper = this.grammar.skippers[id];
    var r = skipper.call(this);

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.get = function(id) {
    var grammar = this.grammar;

    var pattern = grammar.patterns[id];
    if (!pattern) {
        pattern = grammar.addToken(id, id);
    }

    return pattern;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Test / Match
//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.is_token = function(id) {
    return this.grammar[id](this);
};

yate.Parser.prototype.token = function(id) {
    var r = this.is_token(id);
    if (!r) { return null; }

    this.next(r.length);

    return r;
};

yate.Parser.prototype.test = function(id) {
    /*
    var key = this.whereKey() + '|' + id;
    var cached = this.cache[key];
    if (cached !== undefined) {
        return cached;
    }
    */

    var state = this.get_state();

    var r = this.get(id)(this);

    this.set_state(state);

    //  this.cache[key] = r;

    return r;
};

yate.Parser.prototype.testAny = function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
        var id = arguments[i];
        if ( this.test(id) ) {
            return id;
        }
    }

    return false;
};

yate.Parser.prototype.testAll = function() {
    var state = this.get_state();

    var r = true;
    for (var i = 0, l = arguments.length; i < l; i++) {
        var t = this.get( arguments[i] ).call(this);

        if (t === null) {
            r = false;
            break;
        }
    }

    this.set_state(state);

    return r;
};

yate.Parser.prototype.match = function(id, params) {
    return this.get(id)(params);

    /*
    var options = {};
    if (typeof id === 'object') {
        options = id.options;
        id = id.rule;
    }

    var skipper = this.set_skipper(options.skipper);

    var rule = this.get(id);
    var r = rule(this, params);

    this.set_skipper(skipper);

    return r;
   */
};

/*
yate.Parser.prototype.matchAny = function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
        var id = arguments[i];
        if ( this.test(id) ) {
            return this.match(id);
        }
    }

    this.error( 'Expected: ' + arguments.join(', ') );
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  Getters / Setters
//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.get_skipper = function() {
    return this.skipper;
};

yate.Parser.prototype.set_skipper = function(id) {
    var skipper = this.skipper;
    //  FIXME: Зачем тут if?
    if (id) {
        this.skipper = id;
        this.skip();
    }

    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.set_state = function(state) {
    this.set_pos(state.pos);
    this.set_skipper(state.skipper);
};

yate.Parser.prototype.get_state = function() {
    return {
        pos: this.input.get_pos(),
        skipper: this.get_skipper()
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser = function(grammar) {
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.add_tokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this.add_token( id, tokens[id] );
    }
};

yate.Parser.prototype.add_token = function(id, token) {
    var compiled = compile_token(token);
    this.tokens[ id.toUpperCase() ] = compiled;

    return compiled;
};

function compile_token(token) {
    if (typeof token === 'string') {
        var l = token.length;

        return function(parser) {
            return (parser.current(l) === token) ? token : null;
        };
    }

    if (token instanceof RegExp) {
        return function(parser) {
            var r = token.exec( parser.current() );

            return (r) ? r[0] : null;
        };
    }

    //  Should be a function.
    return token;
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.add_keywords = function(keywords) {
    keywords = keywords || [];

    var that = this;
    keywords.forEach(function(keyword) {
        var l = keyword.length;
        that.add_token(keyword, function(parser) {
            var current = parser.input;

            if ( current.substr(0, l) !== keyword ) {
                return null;
            }

            var c = current.charCodeAt(l + 1);
            if ( (c > 64 && c < 91) || (c > 96 && c < 123) || (c > 47 && c < 58) || c === 95 || c === 45 ) {
                return null;
            }

            return keyword;
        });
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.add_rules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this.add_rule( id, rules[id] );
    }
};

yate.Parser.prototype.add_rule = function(id, rule) {
    if (typeof rule === 'function') {
        this.rules[id] = compile_rule(id, rule);
    } else {
        this.rules[id] = compile_rule(id, rule.rule, rule.options);
    }
};

function compile_rule(id, rule, options) {
    var skipper = options && options.skipper;

    if (skipper) {
        return function(parser, params) {
            var _skipper = parser.set_skipper(skipper);

            var ast = parser.make_ast(id);
            var r = rule(parser, ast, params);

            this.set_skipper(_skipper);

            return (r === undefined) ? ast : r;
        };
    }

    return function(parser, params) {
        var ast = parser.make_ast(id);
        var r = rule(parser, ast, params);

        return (r === undefined) ? ast : r;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

yate.Parser.prototype.add_skippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this.add_skipper( id, skippers[id] );
    }
};

yate.Parser.prototype.add_skipper = function(id, skipper) {
    this.skippers[id] = compile_skipper(id, skipper);
};

function compile_skipper(id, skipper) {
    if (skipper instanceof RegExp) {
        return function(parser) {
            var r = skipper.exec( parser.current() );

            if (r) {
                var s = r[0];
                if (s) {
                    parser.next(s.length);
                    //  Что-то поскипали.
                    return true;
                }
            }
        };
    }

    //  Should be a function.
    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

