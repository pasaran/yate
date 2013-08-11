var yate = require('./yate.js');

var path_ = require('path');
var fs_ = require('fs');

//  ---------------------------------------------------------------------------------------------------------------  //

function Parser(grammar, factory) {
    this.tokens = {};
    this.rules = {};
    this.skippers = {};

    this.add_tokens(grammar.tokens);
    this.add_keywords(grammar.keywords);
    this.add_rules(grammar.rules);
    this.add_skippers(grammar.skippers);

    this.factory = factory;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.parse = function(filename, rule) {
    this.filename = path_.resolve(filename);

    var content = fs_.readFileSync(this.filename, 'utf-8');
    //  Strip UTF-8 BOM
    if ( content.charAt(0) === '\uFEFF' ) {
        content = content.substr(1);
    }

    this.lines = content.split('\n');
    this.x = 0;
    this.y = 0;
    this.input = this.lines[0];

    this.skipper = null;
    //  this.cache = {};

    return this.match(rule);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.next = function(n) {
    return this.input.substr(0, n);
};

Parser.prototype.move = function(n) {
    this.x += n;

    this.input = this.input.substr(n);
};

Parser.prototype.nextline = function() {
    this.x = 0;
    this.y += 1;

    this.input = this.lines[this.y];
};

Parser.prototype.is_eol = function() {
    return (this.input === '');
};

Parser.prototype.eol = function() {
    if ( !this.is_eol() ) {
        this.error('EOL expected');
    }
    this.nextline();
};

Parser.prototype.is_eof = function() {
    return (this.input === undefined);
};

Parser.prototype.eof = function() {
    if ( !this.is_eof() ) {
        this.error('EOF expected');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.where = function() {
    return {
        x: this.x,
        y: this.y,
        filename: this.filename
    };
};

/*
Parser.prototype.whereKey = function(id) {
    return this.x + '|' + this.y;
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get_pos = function() {
    return {
        x: this.x,
        y: this.y
    };
};

Parser.prototype.set_pos = function(pos) {
    var x = this.x = pos.x;
    var y = this.y = pos.y;

    this.input = this.lines[y].substr(x);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get_ast = function(id, params) {
    return this.factory.make( id, this.where(), params );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Errors
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.error = function(msg) {
    //  FIXME
    throw new Error( msg, this.where() );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.skip = function(id) {
    id || (( id = this.skipper ));

    if (id) {
        return this.skippers[id](this);
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get_token = function(id) {
    var token = this.tokens[id];
    if (!token) {
        token = this.add_token(id, id);
    }

    return token;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Test / Match
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.is_token = function(id) {
    return this.get_token(id)(this);
};

Parser.prototype.token = function(id) {
    var r = this.is_token(id);

    if (!r) {
        this.error('Token ' + id + ' expected');
    }

    this.move(r.length);

    this.skip();

    return r;
};

Parser.prototype.is_tokens = function() {
    var pos = this.get_pos();

    var r = true;
    for (var i = 0, l = arguments.length; i < l; i++) {
        var r = this.is_token( arguments[i] );

        if (!r) {
            r = false;
            break;
        }

        this.move(r.length);
        this.skip();
    }

    this.set_pos(pos);

    return r;
};

Parser.prototype.match = function(id, params) {
    return this.rules[id](this, params);
};

Parser.prototype.match_any = function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
        var r = this.is_token( arguments[i] );

        if (r) {
            this.move(r.length);
            this.skip();

            return r;
        }
    }

    this.error( 'Expected: ' + arguments.join(', ') );
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Getters / Setters
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get_skipper = function() {
    return this.skipper;
};

Parser.prototype.set_skipper = function(id) {
    var skipper = this.skipper;

    this.skipper = id;
    this.skip();

    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get_state = function() {
    return {
        pos: this.get_pos(),
        skipper: this.get_skipper()
    };
};

Parser.prototype.set_state = function(state) {
    this.set_pos(state.pos);
    this.set_skipper(state.skipper);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.add_tokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this.add_token( id, tokens[id] );
    }
};

Parser.prototype.add_token = function(id, token) {
    var compiled = compile_token(token);
    this.tokens[ id.toUpperCase() ] = compiled;

    return compiled;
};

function compile_token(token) {
    if (typeof token === 'string') {
        var l = token.length;

        return function(parser) {
            return ( parser.next(l) === token ) ? token : null;
        };
    }

    if (token instanceof RegExp) {
        return function(parser) {
            var r = token.exec(parser.input);

            return (r) ? r[0] : null;
        };
    }

    //  Should be a function.
    return token;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.add_keywords = function(keywords) {
    keywords = keywords || [];

    var that = this;
    keywords.forEach(function(keyword) {
        var l = keyword.length;
        that.add_token(keyword, function(parser) {
            var input = parser.input;

            if ( input.substr(0, l) !== keyword ) {
                return null;
            }

            var c = input.charCodeAt(l);
            if ( (c > 64 && c < 91) || (c > 96 && c < 123) || (c > 47 && c < 58) || c === 95 || c === 45 ) {
                return null;
            }

            return keyword;
        });
    });
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.add_rules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this.add_rule( id, rules[id] );
    }
};

Parser.prototype.add_rule = function(id, rule) {
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
            //  console.error('rule', id, parser.input);
            var _skipper = parser.set_skipper(skipper);

            var ast = parser.get_ast(id);
            var r = rule(parser, ast, params);

            parser.set_skipper(_skipper);

            return (r === undefined) ? ast : r;
        };
    }

    return function(parser, params) {
        //  console.error('rule', id, parser.input);
        var ast = parser.get_ast(id);
        var r = rule(parser, ast, params);

        return (r === undefined) ? ast : r;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.add_skippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this.add_skipper( id, skippers[id] );
    }
};

Parser.prototype.add_skipper = function(id, skipper) {
    this.skippers[id] = compile_skipper(id, skipper);
};

function compile_skipper(id, skipper) {
    if (skipper instanceof RegExp) {
        return function(parser) {
            var r = skipper.exec( parser.input );

            if (r) {
                var s = r[0];
                if (s) {
                    parser.move(s.length);
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

var grammar = require('./grammar.js');
var asts = require('./asts.js');
var factory = require('./factory.js');

module.exports = new Parser(grammar, factory);

//  ---------------------------------------------------------------------------------------------------------------  //

