//  ---------------------------------------------------------------------------------------------------------------  //
//  InputStream
//  ---------------------------------------------------------------------------------------------------------------  //

var fs_ = require('fs');
var path_ = require('path');

//  ---------------------------------------------------------------------------------------------------------------  //

function InputStream(filename) {
    this.filename = path_.resolve(filename);
    var input = fs_.readFileSync(this.filename, 'utf-8');

    this.lines = input.split('\n');
    this.x = 0;
    this.y = 0;
    this.line = this.lines[0];
};

//  ---------------------------------------------------------------------------------------------------------------  //

InputStream.prototype.current = function(n) {
    return (n) ? this.line.substr(0, n) : this.line;
};

InputStream.prototype.next = function(n) {
    this.x += n;
    this.line = this.line.substr(n);
};

InputStream.prototype.nextLine = function(n) {
    this.x = 0;
    this.y += (n || 1);
    this.line = this.lines[this.y];
};

InputStream.prototype.isEOL = function() {
    return (this.line === '');
};

InputStream.prototype.isEOF = function() {
    return (this.line === undefined);
};

//  ---------------------------------------------------------------------------------------------------------------  //

InputStream.prototype.where = function(pos) {
    var input = (pos) ? pos.input : this;
    var pos = pos || this;

    var where = 'at (' + (pos.x + 1) + ', ' + (pos.y + 1) + ') in ' + input.filename;

    var line = input.lines[pos.y] || '';
    where += ':\n' + line + '\n' + Array(pos.x + 1).join('-') + '^';

    return where;
};

InputStream.prototype.whereKey = function() {
    return this.x + '|' + this.y;
};

//  ---------------------------------------------------------------------------------------------------------------  //

InputStream.prototype.setPos = function(pos) {
    var x = this.x = pos.x;
    var y = this.y = pos.y;
    this.line = this.lines[y].substr(x);
};

InputStream.prototype.getPos = function() {
    return {
        x: this.x,
        y: this.y,
        input: this
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = InputStream;

//  ---------------------------------------------------------------------------------------------------------------  //

