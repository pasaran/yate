Yate.AST.key.js = function() {
    this.$body.trigger(function() {
        this.role = 'var';
        this.$varname = 'value';
    });

    this.$use.trigger('set', '$cid', this.$use.$cid + 1);

    return this._js();
};

