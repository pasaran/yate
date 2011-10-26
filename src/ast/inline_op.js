yate.AST.inline_op = {};

yate.AST.inline_op.options = {
    base: 'inline_expr'
};

yate.AST.inline_op.prepare = function() {
    var signature = this.signature;
    if (signature) {
        this.Left.cast(signature.left);
        if (this.Right) {
            this.Right.cast(signature.right);
        }
    }
};

yate.AST.inline_op.isLocal = function() {
    return this.Left.isLocal() || ( this.Right && this.Right.isLocal() );
};

yate.AST.inline_op._getType = function() {
    return this.signature.result;
};

yate.AST.inline_op.getScope = function() {
    var lscope = this.Left.getScope();
    if (this.Right) {
        var rscope = this.Right.getScope();
        return yate.Scope.commonScope( lscope, rscope );
    } else {
        return lscope;
    }
};

