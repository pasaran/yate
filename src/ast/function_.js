yate.AST.function_ = {};

yate.AST.function_.action = function() {
    var functions = this.scope.functions;
    var name = this.Name;

    if (functions[name]) {
        this.error('Повторное определение функции или ключа ' + name);
    }

    this.Fid = this.state.fid++;
    this.Type = yate.AST.function_type.USER;

    functions[name] = this;
};

yate.AST.function_.validate = function() {
    if (this.Body.type() === 'undef') {
        this.error('Undefined type of return value');
    }
};

yate.AST.function_._getType = function() {
    return this.Body.type();
};

yate.AST.function_.prepare = function() {
    var body = this.Body;
    body.cast( body.type() );
};

yate.AST.function_.extractDefs = function() {
    this.scope.defs.push(this);
};

