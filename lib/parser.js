// ################################################################################################################# //
//
// Parser
//
// ################################################################################################################# //

Yate.Parser = {

    _patterns: {},
    _skippers: {},

    _skipper: null

};

// ----------------------------------------------------------------------------------------------------------------- //
// Init
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.init = function(grammar) {
    this._addTokens(grammar.tokens);
    this._addKeywords(grammar.keywords);
    this._addRules(grammar.rules);
    this._addSkippers(grammar.skippers);
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._addTokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this._addToken(id, tokens[id]);
    }
};

Yate.Parser._addToken = function(id, token) {
    token = this._makeToken(id, token);
    this._patterns[id.toUpperCase()] = token;
    return token;
};

Yate.Parser._makeToken = function(id, token) {
    if (typeof token == 'string') {
        var l = token.length;
        return function() {
            if (this.current(l) == token) {
                this.next(l);
                this.skip();
                return token;
            }
            this.error('Expected token ' + id);
        };
    } else if (token instanceof RegExp) {
        return function() {
            var r = token.exec(this.current());
            if (r) {
                r = r[0];
                var l = r.length;
                if (l) {
                    this.next(l);
                    this.skip();
                }
                return r;
            }
            this.error('Expected token ' + id);
        };
    } else if (typeof token == 'function') {
        return token;
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._addKeywords = function(keywords) {
    keywords = keywords || [];
    for (var i = 0, l = keywords.length; i < l; i++) {
        var keyword = keywords[i];
        this._addToken(keyword, new RegExp('^' + keyword + '\\b'));
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._addRules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this._addRule(id, rules[id]);
    }
};

Yate.Parser._addRule = function(id, rule) {
    if (typeof rule == 'function') {
        this._patterns[id] = this._makeRule(id, rule);
    } else {
        this._patterns[id] = this._makeRule(id, rule.rule, rule.options);
    }
};

Yate.Parser._makeRule = function(id, rule, options) {
    options = options || {};

    var that = this;
    var wrapper = function() {
        var _skipper = that.setSkipper(options.skipper);

        var ast = that._makeAST(id);
        var args = Array.prototype.slice.call(arguments);
        args.unshift(ast);
        var r = rule.apply(that, args);

        that.setSkipper(_skipper);

        return (r !== undefined) ? r : ast;
    };
    wrapper.options = options;

    return wrapper;
};

Yate.Parser._makeAST = function(id) {
    var ast = Yate.AST.make(id);
    ast.where = this._getPos();
    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._addSkippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this._addSkipper(id, skippers[id]);
    }
};

Yate.Parser._addSkipper = function(id, skipper) {
    this._skippers[id] = this._makeSkipper(id, skipper);
};

Yate.Parser._makeSkipper = function(id, skipper) {
    if (skipper instanceof RegExp) {
        return function() {
            var r = skipper.exec(this.current());
            if (r) {
                r = r[0];
                var l = r.length;
                if (l) {
                    this.next(l);
                    return true; // Что-то поскипали.
                }
            }
        };
    } else if (typeof skipper == 'function') {
        return skipper;
    }
};

// ----------------------------------------------------------------------------------------------------------------- //
// Open
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.open = function(o) {
    var input = o.input;

    if (!input) {
        this._filename = o.filename;
        input = require('fs').readFileSync(o.filename, 'utf-8');
    }

    this._lines = input.split('\n');
    this._x = 0;
    this._y = 0;
    this._current = this._lines[0];
};

// ----------------------------------------------------------------------------------------------------------------- //
// Input manipulations
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.current = function(n) {
    return (n) ? this._current.substr(0, n) : this._current;
};

Yate.Parser.next = function(n) {
    this._x += n;
    this._current = this._current.substr(n);
};

Yate.Parser.nextLine = function(n) {
    this._x = 0;
    this._y += (n || 1);
    this._current = this._lines[this._y];
};

Yate.Parser._rx_EOL = /^\s*(\/\/.*)?$/;

Yate.Parser.isEOL = function() {
    return this._rx_EOL.test(this.current());
};

Yate.Parser.eol = function() {
    if (this.isEOL()) {
        this.nextLine();
        this.skip();
    } else {
        this.error('EOL expected');
    }
};

Yate.Parser.isEOF = function() {
    return (this._current === undefined);
};

// ----------------------------------------------------------------------------------------------------------------- //
// Errors
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.error = function(error) {
    error = error || 'Unknown error';

    var msg = 'SYNTAX ERROR: ' + error + '.\n';
    msg += this._where();

    throw msg;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._where = function(pos) {
    pos = pos || this;

    var where = 'at (' + (pos._x + 1) + ', ' + (pos._y + 1) + ')';
    if (pos._filename) {
        where += ' in ' + pos._filename;
    }
    var line = this._lines[pos._y] || '';
    where += ':\n' + line + '\n' + Array(pos._x + 1).join('-') + '^';

    return where;
};

// ----------------------------------------------------------------------------------------------------------------- //
Yate.Parser.skip = function(id) {
    id = id || this._skipper;
    var skipper = this._skippers[id];
    var r = skipper.call(this);
    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._$ = function(id) {
    var pattern = this._patterns[id];
    if (!pattern) {
        pattern = this._addToken(id, id);
    }
    return pattern;
};

// ----------------------------------------------------------------------------------------------------------------- //
// Test / Match
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.test = function(id) {
    var state = this._getState();
    var r = true;
    try {
        this._$(id).call(this);
    } catch (e) {
        r = false;
        // console.log(e);
    }
    this._setState(state);

    return r;
};

Yate.Parser.testAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return id;
        }
    }
    return false;
};

Yate.Parser.testAll = function(ids) {
    var state = this._getState();
    var r = true;
    try {
        for (var i = 0, l = ids.length; i < l; i++) {
            this._$(ids[i]).call(this);
        }
    } catch (e) {
        r = false;
        // console.log(e);
    }
    this._setState(state);

    return r;
};

// match('rule')
// match('rule', 42)
// match({ rule: 'rule', options: {} }, 42)

Yate.Parser.match = function(id) {
    var options = {};
    if (typeof id == 'object') {
        options = id.options;
        id = id.rule
    }
    var skipper = this.setSkipper(options.skipper);
    var args = Array.prototype.slice.call(arguments, 1);
    var r = this._$(id).apply(this, args);
    this.setSkipper(skipper);
    return r;
};

Yate.Parser.matchAll = function(ids) {

};

// ----------------------------------------------------------------------------------------------------------------- //
// Getters / Setters
// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser.getSkipper = function() {
    return this._skipper;
};

Yate.Parser.setSkipper = function(id) {
    var current = this._skipper;
    if (id) {
        this._skipper = id;
        this.skip();
    }
    return current;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._setState = function(state) {
    this._setPos(state.pos);
    this.setSkipper(state.skipper);
};

Yate.Parser._getState = function() {
    return {
        pos: this._getPos(),
        skipper: this.getSkipper()
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.Parser._setPos = function(pos) {
    this._x = pos._x;
    this._y = pos._y;
    this._current = this._lines[this._y].substr(this._x);
};

Yate.Parser._getPos = function() {
    return {
        _x: this._x,
        _y: this._y
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

