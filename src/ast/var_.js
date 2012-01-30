yate.AST.var_ = {};

yate.AST.var_.action = function() {
    var vars = this.scope.vars;
    var name = this.Name;

    if (vars[name]) {
        this.error('Повторное определение переменной ' + name);
    }

    this.Vid = this.state.vid++;
    this.Type = yate.AST.var_type.USER;

    if (!this.scope.parent) { // NOTE: В данный момент все глобальные переменные будут "ленивыми".
                              // FIXME: Делать ленивыми только неконстантные переменные.
        this.Lazy = true;
    }

    vars[name] = this;
};

yate.AST.var_._getType = function() {
    return this.Value.type();
};

yate.AST.var_.setTypes = function() {
    this.Value.cast();
};

yate.AST.var_.prepare = function() {
    this.Value.rid();
};

yate.AST.var_.extractDefs = function() {
    this.scope.defs.push(this);
};

