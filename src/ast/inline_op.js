Yate.AST.inline_op = {

    options: {
        base: 'inline_expr'
    },

    prepare: function() {
        var signature = this.signature;
        if (signature) {
            this.Left.cast(signature.left);
            if (this.Right) {
                this.Right.cast(signature.right);
            }
        }
    },

    isLocal: function() {
        return this.Left.isLocal() || ( this.Right && this.Right.isLocal() );
    },

    _getType: function() {
        return this.signature.result;
    }

};

