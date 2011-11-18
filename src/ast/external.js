yate.AST.external = {};

yate.AST.external.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.External = true;

    functions[name] = this;
};

yate.AST.external._getType = function() {
    return this.Type;
};

