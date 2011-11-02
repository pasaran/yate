yate.AST.arglist_item = {};

yate.AST.arglist_item.action = function() {
    var vars = this.parent.scope.vars;
    var name = this.Name;
    if (vars[name]) {
        this.error('Повторное определение аргумента ' + this.Name);
    }

    this.Vid = this.state.vid++;
    this.Type = yate.AST.var_type.ARGUMENT;

    vars[name] = this;
};

yate.AST.arglist_item._getType = function() {
    if (this.Typedef == 'nodeset') { return yate.types.NODESET; }
    if (this.Typedef == 'boolean') { return yate.types.BOOLEAN; }
    return yate.types.SCALAR;
};

