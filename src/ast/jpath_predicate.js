yate.AST.jpath_predicate = {};

yate.AST.jpath_predicate.action = function() {
    var key = this.Expr.yate(); // Каноническая запись предиката.

    var state = this.state;
    var scope = this.getScope(); // См. примечание в jpath.action() (jpath.js).

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.predicates.push(this);
    }

    this.Pid = pid;
    this.Key = key;
};

yate.AST.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

yate.AST.jpath_predicate.prepare = function() {
    if (this.isLocal()) {
        this.Expr.cast( yate.types.BOOLEAN );
    } else {
        this.Expr.cast( yate.types.SCALAR );
    }
};

yate.AST.jpath_predicate.validate = function() {
    if (!this.Expr.type( yate.types.BOOLEAN )) {
        this.Expr.error('Type must be BOOLEAN');
    }
};

