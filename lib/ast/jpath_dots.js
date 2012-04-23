var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.jpath_dots = {};

AST.jpath_dots.action = function() {
    this.Length = this.Dots.length - 1;
};

