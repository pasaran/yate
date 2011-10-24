// ----------------------------------------------------------------------------------------------------------------- //
// Locals: state, context, scope
// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.Local = function() {
};

Yate.AST.Local.prototype.child = function() {
    var local = new this.constructor();
    local.parent = this;
    return local;
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.Local.State = function() {
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

Yate.Common.inherits(Yate.AST.Local.State, Yate.AST.Local);

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.Local.Context = function() { // FIXME: Что предполагалось должен делать Context?
};

Yate.Common.inherits(Yate.AST.Local.Context, Yate.AST.Local);

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.Local.Scope = function() {
    this.vars = {};
    this.functions = {};
    this.id = Yate.AST.Local.Scope._id++;
};

Yate.AST.Local.Scope._id = 0;

Yate.Common.inherits(Yate.AST.Local.Scope, Yate.AST.Local);

Yate.AST.Local.Scope.prototype.findVar = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.vars[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
};

Yate.AST.Local.Scope.prototype.findFunction = function(name) {
    var scope = this;
    while (scope) {
        var value = scope.functions[name];
        if (value) {
            return value;
        }
        scope = scope.parent;
    }
    return Yate.AST.internalFunctions[name]; // Если ничего не нашли в scope'ах, смотрим на список встроенных функций.
};

// ----------------------------------------------------------------------------------------------------------------- //

Yate.AST.locals = {
    state: Yate.AST.Local.State,
    context: Yate.AST.Local.Context,
    scope: Yate.AST.Local.Scope
};

