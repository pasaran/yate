yate.AST.jpath_predicate = {};

yate.AST.jpath_predicate.getScope = function() {
    return this.Expr.getScope();
};

yate.AST.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

yate.AST.jpath_predicate.prepare = function() {
    if (this.isLocal()) {
        this.Expr.cast( 'boolean' );
    } else {
        this.Expr.cast( 'scalar' );
    }
};

yate.AST.jpath_predicate.validate = function() {
    if (!this.Expr.type( 'boolean' )) {
        this.Expr.error('Type must be BOOLEAN');
    }
};

yate.AST.jpath_predicate.extractDefs = function() {
    var key = this.Expr.yate(); // Каноническая запись предиката.

    var state = this.state;
    var scope = this.getScope(); // См. примечание в jpath.action() (jpath.js).

    // Если этот jpath еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    this.Pid = pid;
    this.Key = key;
};

