Yate.AST.for_.js = function() {
    var body = this.$body;

    body.trigger(function() {
        this.$cid++;
        this.role = 'output';
    });

    return this._js();
};

