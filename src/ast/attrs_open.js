yate.AST.attrs_open = {

    _init: function(item) {
        this.Attrs = item.Attrs;
        item.Attrs = null; // FIXME: В правой части, похоже, можно что угодно написать. Нужна ли эта строчка вообще?
    },

    _type: yate.types.XML

};

