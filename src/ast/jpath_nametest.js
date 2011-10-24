yate.AST.jpath_nametest = {

    hasGlobalPredicate: function() {
        var predicates = this.Predicates;
        if (predicates) {
            var items = predicates.Items;
            for (var i = 0, l = items.length; i < l; i++) {
                if ( !items[i].isLocal() ) {
                    return true;
                }
            }
        }
        return false;
    }

};

