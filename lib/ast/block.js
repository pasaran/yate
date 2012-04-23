var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.block = {};

AST.block.options = {
    scope: true,
    order: [ 'Defs', 'Templates', 'Exprs' ] //// , 'AsList' ]
};

AST.block._init = function(exprs) {
    this.Defs = AST.make('block_defs');
    this.Templates = AST.make('block_templates');
    this.Exprs = AST.make('block_exprs', exprs);
};

AST.block._getType = function() {
    return this.Exprs.type();
};

AST.block.action = function() {
    // this.Exprs.AsList = this.AsList;

    if ( this.Defs.empty() && this.Templates.empty() && this.Exprs.inline() ) {
        this.Inline = true;
    }
};

AST.block.oncast = function(to) {
    this.Exprs.cast(to);
};

AST.block.closes = function() {
    var exprs = this.Exprs.Items; // FIXME: Может таки унести это в block_exprs.closes?
    if (!exprs.length) { return false; }

    return exprs[0].closes();
};

AST.block.setPrevOpened = function(prevOpened) {
    this.prevOpened = prevOpened;
};

