//  ---------------------------------------------------------------------------------------------------------------  //
//  Parser
//  ---------------------------------------------------------------------------------------------------------------  //

var InputStream = require('./inputstream.js');

//  ---------------------------------------------------------------------------------------------------------------  //

var Parser = function(grammar, factory) {
    this.grammar = grammar;
    this.factory = factory;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.read = function(filename) {
    this.input = new InputStream(filename);
    this.skipper = null;
    this.cache = {};
};

Parser.prototype.parse = function(filename, rule) {
    this.read(filename);
    return this.match(rule);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.makeAST = function(id) {
    var ast = this.factory.make(id);
    ast.where = this.input.getPos();

    return ast;
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Errors
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.error = function(error) {
    error = error || 'Unknown error';

    var msg = 'ERROR: ' + error + '\n';
    msg += this.input.where();

    throw new Error(msg);
};

//  Этот метод нужен для того, чтобы показать,
//  что правило не смогло правильно сматчиться и нужно делать backtrace.
Parser.prototype.backtrace = function(error) {
    error = error || this.id + ' expected';

    throw new Error('PARSE ERROR: ' + error);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.skip = function(id) {
    id = id || this.skipper;
    var skipper = this.grammar.skippers[id];
    var r = skipper.call(this);

    return r;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.get = function(id) {
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

Parser.prototype.test = function(id) {
    var key = this.input.whereKey() + '|' + id;
    var cached = this.cache[key];
    if (cached !== undefined) {
        return cached;
    }

    var state = this.getState();
    var r = true;
    try {
        this.get(id).call(this);
        /// console.log('Ok: ' + id);
    } catch (e) {
        r = false;
        /// console.log('Failed: ' + id, e);
    }
    this.setState(state);

    this.cache[key] = r;

    return r;
};

Parser.prototype.testAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return id;
        }
    }

    return false;
};

Parser.prototype.testAll = function(ids) {
    var state = this.getState();
    var r = true;
    try {
        for (var i = 0, l = ids.length; i < l; i++) {
            this.get( ids[i] ).call(this);
        }
    } catch (e) {
        r = false;
        /// console.log(e);
    }
    this.setState(state);

    return r;
};

Parser.prototype.match = function(id, params) {
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

Parser.prototype.matchAny = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
        var id = ids[i];
        if (this.test(id)) {
            return this.match(id);
        }
    }

    this.error('Nothing matched');
};

//  ---------------------------------------------------------------------------------------------------------------  //
//  Getters / Setters
//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.getSkipper = function() {
    return this.skipper;
};

Parser.prototype.setSkipper = function(id) {
    var skipper = this.skipper;
    if (id) {
        this.skipper = id;
        this.skip();
    }

    return skipper;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Parser.prototype.setState = function(state) {
    this.input.setPos(state.pos);
    this.setSkipper(state.skipper);
};

Parser.prototype.getState = function() {
    return {
        pos: this.input.getPos(),
        skipper: this.getSkipper()
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Parser;

//  ---------------------------------------------------------------------------------------------------------------  //

