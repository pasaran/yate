// ################################################################################################################# //
// Parser
// ################################################################################################################# //

yate.Parser = function(grammar) {
    this.patterns = {};
    this.skippers = {};

    this.addTokens(grammar.tokens);
    this.addKeywords(grammar.keywords);
    this.addRules(grammar.rules);
    this.addSkippers(grammar.skippers);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.read = function(filename) {
    this.input = new yate.InputStream(filename);
    this.skipper = null;
    this.cache = {}; // FIXME: Не лучше ли унести это в this.input? Если мы меняем input, то нужно и кэш подменять.
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.addTokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this.addToken( id, tokens[id] );
    }
};

yate.Parser.prototype.addToken = function(id, token) {
    token = this.makeToken(id, token);
    this.patterns[ id.toUpperCase() ] = token;

    return token;
};

yate.Parser.prototype.makeToken = function(id, token) {
    if (typeof token === 'string') {
        var l = token.length;
        return function() {
            if (this.input.current(l) === token) {
                this.input.next(l);
                this.skip();
                return token;
            }
            this.error('Expected token ' + id);
        };

    } else if (token instanceof RegExp) {
        return function() {
            var r = token.exec( this.input.current() );
            if (r) {
                r = r[0];
                var l = r.length;
                if (l) {
                    this.input.next(l);
                    this.skip();
                }
                return r;
            }
            this.error('Expected token ' + id);
        };

    } else if (typeof token === 'function') {
        return token;

    }
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.addKeywords = function(keywords) {
    keywords = keywords || [];
    for (var i = 0, l = keywords.length; i < l; i++) {
        var keyword = keywords[i];
        this.addToken( keyword, new RegExp('^' + keyword + '\\b') );
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.addRules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this.addRule( id, rules[id] );
    }
};

yate.Parser.prototype.addRule = function(id, rule) {
    if (typeof rule === 'function') {
        this.patterns[id] = this.makeRule(id, rule);
    } else {
        this.patterns[id] = this.makeRule(id, rule.rule, rule.options);
    }
};

yate.Parser.prototype.makeRule = function(id, rule, options) {
    options = options || {};

    var that = this;
    var wrapper = function(params) {
        params = params || {};

        var skipper = that.setSkipper(options.skipper);

        var ast = that.makeAST(id);
        var r = rule.call(that, ast, params);

        that.setSkipper(skipper);

        return (r || ast);
    };

    return wrapper;
};

yate.Parser.prototype.makeAST = function(id) {
    var ast = yate.AST.make(id);
    ast.where = this.input.getPos();

    return ast;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.addSkippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this.addSkipper( id, skippers[id] );
    }
};

yate.Parser.prototype.addSkipper = function(id, skipper) {
    this.skippers[id] = this.makeSkipper(id, skipper);
};

yate.Parser.prototype.makeSkipper = function(id, skipper) {
    if (skipper instanceof RegExp) {
        return function() {
            var r = skipper.exec( this.input.current() );
            if (r) {
                r = r[0];
                var l = r.length;
                if (l) {
                    this.input.next(l);
                    return true; // Что-то поскипали.
                }
            }
        };

    } else if (typeof skipper === 'function') {
        return skipper;

    }
};


// ----------------------------------------------------------------------------------------------------------------- //
// Errors
// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.error = function(error) {
    error = error || 'Unknown error';

    var msg = 'ERROR: ' + error + '\n';
    msg += this.input.where();

    throw new Error(msg);
};

// Этот метод нужен для того, чтобы показать, что правило не смогло правильно сматчиться и нужно делать backtrace.
yate.Parser.prototype.backtrace = function(error) {
    error = error || this.id + ' expected';

    throw new Error('PARSE ERROR: ' + error);
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.skip = function(id) {
    id = id || this.skipper;
    var skipper = this.skippers[id];
    var r = skipper.call(this);

    return r;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.get = function(id) {
    var pattern = this.patterns[id];
    if (!pattern) {
        pattern = this.addToken(id, id);

    }
    return pattern;
};

// ----------------------------------------------------------------------------------------------------------------- //
// Test / Match
// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.test = function(id) {
    var key = this.input.whereKey() + '|' + id;
    var cached = this.cache[key];
    if (cached !== undefined) {
        return cached;
    }

    var state = this.getState();
    var r = true;
    try {
        this.get(id).call(this);
    } catch (e) {
        r = false;
        // console.log(e);
    }
    this.setState(state);

    this.cache[key] = r;

    return r;
};

yate.Parser.prototype.testAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return id;
        }
    }

    return false;
};

yate.Parser.prototype.testAll = function(ids) {
    var state = this.getState();
    var r = true;
    try {
        for (var i = 0, l = ids.length; i < l; i++) {
            this.get( ids[i] ).call(this);
        }
    } catch (e) {
        r = false;
        // console.log(e);
    }
    this.setState(state);

    return r;
};

yate.Parser.prototype.match = function(id, params) {
    var options = {};
    if (typeof id === 'object') {
        options = id.options;
        id = id.rule
    }

    var skipper = this.setSkipper(options.skipper);

    var rule = this.get(id);
    var r = rule.call(this, params);

    this.setSkipper(skipper);

    return r;
};

yate.Parser.prototype.matchAny = function(ids) {
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

yate.Parser.prototype.getSkipper = function() {
    return this.skipper;
};

yate.Parser.prototype.setSkipper = function(id) {
    var skipper = this.skipper;
    if (id) {
        this.skipper = id;
        this.skip();
    }

    return skipper;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.Parser.prototype.setState = function(state) {
    this.input.setPos(state.pos);
    this.setSkipper(state.skipper);
};

yate.Parser.prototype.getState = function() {
    return {
        pos: this.input.getPos(),
        skipper: this.getSkipper()
    };
};

// ----------------------------------------------------------------------------------------------------------------- //

