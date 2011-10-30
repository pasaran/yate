// ################################################################################################################# //
//
// Parser
//
// ################################################################################################################# //

yate.parser = {

    _patterns: {},
    _skippers: {},

    _skipper: null

};

// ----------------------------------------------------------------------------------------------------------------- //
// Init
// ----------------------------------------------------------------------------------------------------------------- //

yate.parser.init = function(grammar) {
    this._addTokens(grammar.tokens);
    this._addKeywords(grammar.keywords);
    this._addRules(grammar.rules);
    this._addSkippers(grammar.skippers);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._addTokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this._addToken(id, tokens[id]);
    }
};

yate.parser._addToken = function(id, token) {
    token = this._makeToken(id, token);
    this._patterns[id.toUpperCase()] = token;
    return token;
};

yate.parser._makeToken = function(id, token) {
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

yate.parser._addKeywords = function(keywords) {
    keywords = keywords || [];
    for (var i = 0, l = keywords.length; i < l; i++) {
        var keyword = keywords[i];
        this._addToken(keyword, new RegExp('^' + keyword + '\\b'));
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._addRules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this._addRule(id, rules[id]);
    }
};

yate.parser._addRule = function(id, rule) {
    if (typeof rule == 'function') {
        this._patterns[id] = this._makeRule(id, rule);
    } else {
        this._patterns[id] = this._makeRule(id, rule.rule, rule.options);
    }
};

yate.parser._makeRule = function(id, rule, options) {
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

yate.parser._makeAST = function(id) {
    var ast = yate.AST.make(id);
    ast.where = this._getPos();
    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._addSkippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this._addSkipper(id, skippers[id]);
    }
};

yate.parser._addSkipper = function(id, skipper) {
    this._skippers[id] = this._makeSkipper(id, skipper);
};

yate.parser._makeSkipper = function(id, skipper) {
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

yate.parser.open = function(o) {
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

yate.parser.current = function(n) {
    return (n) ? this._current.substr(0, n) : this._current;
};

yate.parser.next = function(n) {
    this._x += n;
    this._current = this._current.substr(n);
};

yate.parser.nextLine = function(n) {
    this._x = 0;
    this._y += (n || 1);
    this._current = this._lines[this._y];
};

yate.parser.isEOL = function() {
    return /^\s*(\/\/.*)?$/.test(this.current());
};

yate.parser.eol = function() {
    if (this.isEOL()) {
        this.nextLine();
        this.skip();
    } else {
        this.error('EOL expected');
    }
};

yate.parser.isEOF = function() {
    return (this._current === undefined);
};

// ----------------------------------------------------------------------------------------------------------------- //
// Errors
// ----------------------------------------------------------------------------------------------------------------- //

yate.parser.error = function(error) {
    error = error || 'Unknown error';

    var msg = 'SYNTAX ERROR: ' + error + '\n';
    msg += this._where();

    throw msg;
};

// Этот метод нужен для того, чтобы показать, что правило не смогло правильно сматчиться и нужно делать backtrace.
yate.parser.backtrace = function(error) {
    error = error || this.id + ' expected';

    throw 'PARSE ERROR: ' + error;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._where = function(pos) {
    pos = pos || this;

    var where = 'at (' + (pos._x + 1) + ', ' + (pos._y + 1) + ')';
    if (pos._filename) {
        where += ' in ' + pos._filename;
    }
    var line = this._lines[pos._y] || '';
    where += ':\n' + line + '\n' + Array(pos._x + 1).join('-') + '^';

    return where;
};

yate.parser._whereKey = function() {
    return this._x + '|' + this._y;
};

// ----------------------------------------------------------------------------------------------------------------- //
yate.parser.skip = function(id) {
    id = id || this._skipper;
    var skipper = this._skippers[id];
    var r = skipper.call(this);
    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._$ = function(id) {
    var pattern = this._patterns[id];
    if (!pattern) {
        pattern = this._addToken(id, id);
    }
    return pattern;
};

// ----------------------------------------------------------------------------------------------------------------- //
// Test / Match
// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._cache = {};

yate.parser.test = function(id) {
    var key = this._whereKey() + '|' + id;
    var cached = this._cache[key];
    if (cached !== undefined) { return cached; }

    var state = this._getState();
    var r = true;
    try {
        this._$(id).call(this);
    } catch (e) {
        r = false;
        // console.log(e);
    }
    this._setState(state);

    this._cache[key] = r;

    return r;
};

yate.parser.testAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return id;
        }
    }
    return false;
};

yate.parser.testAll = function(ids) {
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

yate.parser.match = function(id) {
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

yate.parser.matchAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return this.match(id);
        }
    }

    this.error('Nothing matched');
};

// ----------------------------------------------------------------------------------------------------------------- //
// Getters / Setters
// ----------------------------------------------------------------------------------------------------------------- //

yate.parser.getSkipper = function() {
    return this._skipper;
};

yate.parser.setSkipper = function(id) {
    var current = this._skipper;
    if (id) {
        this._skipper = id;
        this.skip();
    }
    return current;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._setState = function(state) {
    this._setPos(state.pos);
    this.setSkipper(state.skipper);
};

yate.parser._getState = function() {
    return {
        pos: this._getPos(),
        skipper: this.getSkipper()
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.parser._setPos = function(pos) {
    this._x = pos._x;
    this._y = pos._y;
    this._current = this._lines[this._y].substr(this._x);
};

yate.parser._getPos = function() {
    return {
        _x: this._x,
        _y: this._y
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

