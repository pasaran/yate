var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.inline_op = {};

AST.inline_op.options = {
    base: 'inline_expr'
};

AST.inline_op.setTypes = function() {
    var signature = this.signature;
    if (signature) {
        this.Left.cast(signature.left);
        if (this.Right) {
            this.Right.cast(signature.right);
        }
    }
};

AST.inline_op.isLocal = function() {
    return this.Left.isLocal() || ( this.Right && this.Right.isLocal() );
};

AST.inline_op._getType = function() {
    return this.signature.result;
};

AST.inline_op.getScope = function() {
    var lscope = this.Left.getScope();
    if (this.Right) {
        var rscope = this.Right.getScope();
        return yate.Scope.commonScope( lscope, rscope );
    } else {
        return lscope;
    }
};

