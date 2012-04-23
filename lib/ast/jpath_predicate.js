var yate = require('../yate.js');
var AST = require('../ast.js');

//  ---------------------------------------------------------------------------------------------------------------  //

AST.jpath_predicate = {};

AST.jpath_predicate.getScope = function() {
    return this.Expr.getScope();
};

AST.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

AST.jpath_predicate.setTypes = function() {
    if (this.isLocal()) { // .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast( 'boolean' );
    } else { // .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast( 'scalar' );
    }
};

AST.jpath_predicate.extractDefs = function() {
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

