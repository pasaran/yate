yate.AST.jpath_nametest = {};

yate.AST.jpath_nametest.hasGlobalPredicate = function() {
    var items = this.Predicates.Items;
    for (var i = 0, l = items.length; i < l; i++) {
        if ( !items[i].isLocal() ) {
            return true;
        }
    }

    return false;
};

yate.AST.jpath_nametest.getScope = function() {
    return this.Predicates.getScope();
};

