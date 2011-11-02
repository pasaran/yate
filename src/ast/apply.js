yate.AST.apply = {};

yate.AST.apply.options = {
    base: 'expr'
};

yate.AST.apply._type = yate.types.UNDEF;

yate.AST.apply.validate = function() {
    if (!this.Expr.type( yate.types.NODESET )) {
        this.error('Type of expression should be NODESET');
    }
};

yate.AST.apply.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

