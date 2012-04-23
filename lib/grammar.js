//  ---------------------------------------------------------------------------------------------------------------  //
//  Grammar
//  ---------------------------------------------------------------------------------------------------------------  //

var Grammar = function(grammar) {
    this.patterns = {};
    this.skippers = {};

    this.addTokens(grammar.tokens);
    this.addKeywords(grammar.keywords);
    this.addRules(grammar.rules);
    this.addSkippers(grammar.skippers);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Grammar.prototype.addTokens = function(tokens) {
    tokens = tokens || {};
    for (var id in tokens) {
        this.addToken( id, tokens[id] );
    }
};

Grammar.prototype.addToken = function(id, token) {
    token = this.makeToken(id, token);
    this.patterns[ id.toUpperCase() ] = token;

    return token;
};

Grammar.prototype.makeToken = function(id, token) {
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
    }

    if (token instanceof RegExp) {
        return function() {
            var r = token.exec( this.input.current() );

            if (r) {
                var s = r[0];

                var l = s.length;
                if (l) {
                    this.input.next(l);
                    this.skip();
                }

                return s;
            }

            this.error('Expected token ' + id);
        };
    }

    //  Should be a function.
    return token;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Grammar.prototype.addKeywords = function(keywords) {
    keywords = keywords || [];
    for (var i = 0, l = keywords.length; i < l; i++) {
        var keyword = keywords[i];
        this.addToken( keyword, new RegExp('^' + keyword + '\\b') );
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

Grammar.prototype.addRules = function(rules) {
    rules = rules || {};
    for (var id in rules) {
        this.addRule( id, rules[id] );
    }
};

Grammar.prototype.addRule = function(id, rule) {
    if (typeof rule === 'function') {
        this.patterns[id] = this.makeRule(id, rule);
    } else {
        this.patterns[id] = this.makeRule(id, rule.rule, rule.options);
    }
};

Grammar.prototype.makeRule = function(id, rule, options) {
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

//  ---------------------------------------------------------------------------------------------------------------  //

Grammar.prototype.addSkippers = function(skippers) {
    skippers = skippers || {};
    for (var id in skippers) {
        this.addSkipper( id, skippers[id] );
    }
};

Grammar.prototype.addSkipper = function(id, skipper) {
    this.skippers[id] = this.makeSkipper(id, skipper);
};

Grammar.prototype.makeSkipper = function(id, skipper) {
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
    }

    //  Should be a function.
    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Grammar;

