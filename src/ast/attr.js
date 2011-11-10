yate.AST.attr = {};

yate.AST.attr.options = {
    base: 'xml'
};

yate.AST.attr._type = 'attr';

yate.AST.attr.prepare = function() {
    if (!this.Value.inline()) {
        this.Value.rid();
    }
    this.Value.cast( 'scalar' );
    this.Value.walkBefore(function(ast) {
        ast.mode = 'attr';; // FIXME: Непонятно, нужно ли тут квотить что-то?
                            //        Или же оно в runtime должно заквотиться в attrs_close?
    });
};

yate.AST.attr.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

