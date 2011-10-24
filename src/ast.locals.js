// ----------------------------------------------------------------------------------------------------------------- //
// Locals: state, context, scope
// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.Local = function() {
};

yate.AST.Local.prototype.child = function() {
    var local = new this.constructor();
    local.parent = this;
    return local;
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.Local.State = function() {
    this.jpaths = [];
    this.jkeys = {};

    this.predicates = [];
    this.pkeys = {};

    // Глобальные id-шники:
    this.jid = 0; // jpath'ы.
    this.pid = 0; // Предикаты.
    this.tid = 0; // Шаблоны.
    this.vid = 0; // Переменные.
    this.fid = 0; // Функции.
    this.kid = 0; // Ключи.
};

yate.Common.inherits(yate.AST.Local.State, yate.AST.Local);

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.Local.Context = function() { // FIXME: Что предполагалось должен делать Context?
};

yate.Common.inherits(yate.AST.Local.Context, yate.AST.Local);

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.Local.Scope = function() {
    this.vars = {};
    this.functions = {};
    this.id = yate.AST.Local.Scope._id++;
};

yate.AST.Local.Scope._id = 0;

yate.Common.inherits(yate.AST.Local.Scope, yate.AST.Local);

yate.AST.Local.Scope.prototype.findVar = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.vars[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
};

yate.AST.Local.Scope.prototype.findFunction = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.functions[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
    return yate.AST.internalFunctions[name]; // Если ничего не нашли в scope'ах, смотрим на список встроенных функций.
};

// ----------------------------------------------------------------------------------------------------------------- //

yate.AST.locals = {
    state: yate.AST.Local.State,
    context: yate.AST.Local.Context,
    scope: yate.AST.Local.Scope
};

