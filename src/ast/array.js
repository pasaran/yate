yate.AST.array = {};

yate.AST.array._type = yate.types.ARRAY;

yate.AST.array.action = function() {
    this.Block.AsList = true;
};

