yate.AST.block = {};

yate.AST.block.options = {
    scope: true,
    order: [ 'Defs', 'Templates', 'Exprs' ] //// , 'AsList' ]
};

yate.AST.block._init = function(exprs) {
    this.Defs = yate.AST.make('block_defs');
    this.Templates = yate.AST.make('block_templates');
    this.Exprs = yate.AST.make('block_exprs', exprs);
};

yate.AST.block._getType = function() {
    return this.Exprs.type();
};

yate.AST.block.action = function() {
    // this.Exprs.AsList = this.AsList;

    if ( this.Defs.empty() && this.Templates.empty() && this.Exprs.inline() ) {
        this.Inline = true;
    }
};

yate.AST.block.oncast = function(to) {
    this.Exprs.cast(to);
};

yate.AST.block.firstCloses = function() {
    var first = this.Exprs.Items[0];
    return first && first.closes();
};

yate.AST.block.closes = function() {
    var exprs = this.Exprs.Items; // FIXME: Может таки унести это в block_exprs.closes?
    for (var i = 0, l = exprs.length; i < l; i++) {
        var expr = exprs[i];
        if (expr.closes()) { return true; }
    }
    return false;
};

