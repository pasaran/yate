yate.AST.apply = {};

yate.AST.apply.options = {
    base: 'expr'
};

yate.AST.apply._type = 'xml';

yate.AST.apply.validate = function() {
    if (!this.Expr.type( 'nodeset' )) {
        this.error('Type of expression should be NODESET');
    }
};

yate.AST.apply.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

