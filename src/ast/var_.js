yate.AST.var_ = {};

yate.AST.var_.action = function() {
    var vars = this.scope.vars;
    var name = this.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    this.Vid = this.state.vid++;
    this.Type = yate.AST.var_type.USER;

    vars[name] = this;
};

yate.AST.var_._getType = function() {
    return this.Value.type();
};

yate.AST.var_.prepare = function() {
    this.Value.cast();
    this.Value.rid();
};

