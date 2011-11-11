yate.AST.if_ = {};

yate.AST.if_.options = {
    base: 'expr'
};

yate.AST.if_._getType = function() {
    var thenType = this.Then.type();
    var elseType = (this.Else) ? this.Else.type() : 'undef';

    return yate.types.commonType(thenType, elseType);
};

yate.AST.if_.setTypes = function() {
    this.Condition.cast('boolean');
};

yate.AST.if_.oncast = function(to) {
    this.Then.cast(to);
    if (this.Else) {
        this.Else.cast(to);
    }
};

yate.AST.if_.closes = function() {
    return this.Then.closes() || this.Else && this.Else.closes();
};

