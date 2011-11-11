yate.AST.attr = {};

yate.AST.attr.options = {
    base: 'xml'
};

yate.AST.attr._type = 'attr';

yate.AST.attr.setTypes = function() {
    this.Value.cast('scalar');
};

yate.AST.attr.prepare = function() {
    if (!this.Value.inline()) {
        this.Value.rid();
    }
};

yate.AST.attr.closes = yate.false;

// ----------------------------------------------------------------------------------------------------------------- //

