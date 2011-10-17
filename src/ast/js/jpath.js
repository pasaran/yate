Yate.AST.jpath.compile = function() {

    var names = [];
    var predicates = [];

    var data;
    var steps = this.Steps;
    if (steps) {
        data = steps.compile();
    } else {
        data = {
            Steps: '[  ]',
            Predicates: '[  ]'
        };
    }
    data.Absolute = (this.Absolute) ? 1 : 0;

    data.Jid = this.Jid;
    data.Key = this.Key;

    return this._js('jpaths_item', data);
};

