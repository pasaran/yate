var asts = require('./asts.js');

//  ---------------------------------------------------------------------------------------------------------------  //
//
//  jpath:
//
//    * jpath
//    * jpath_steps
//    * jpath_dors
//    * jpath_predicate
//    * jpath_filter
//    * simple_jpath
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath = {};

asts.jpath.options = {
    base: 'inline_expr',
    props: 'Abs Context Steps'
};

asts.jpath._getType = no.value('nodeset');

asts.jpath.isLocal = function() {
    return !this.Abs;
};

asts.jpath.w_action = function() {
    if ( this.isSimple() ) {
        this.f.IsSimple = true;
        this.Name = this.Steps.first().p.Name;
    }
};

asts.jpath.isSimple = function() {
    var steps = this.Steps;
    return ( steps.length() === 1 && steps.first().is('jpath_nametest') );
};

asts.jpath.isRoot = function() {
    return this.Abs && this.Steps.empty();
};

asts.jpath.w_validate = function() {
    var context = this.Context;
    if ( context && !context.getType('nodeset') ) {
        context.error('Invalid type. Should be NODESET');
    }
};

asts.jpath.validateMatch = function() {
    var steps = this.Steps.p;
    for (var i = 0, l = steps.length; i < l; i++) {
        var step = steps[i];
        if ( step.is('jpath_dots') ) {
            step.error('You can\'t use parent axis in match');
        }
        if ( step.is('jpath_predicate') && !step.isMatchable() ) {
            step.error('You can\'t use index in match');
        }
    }
};

// oncast = function() {},

// Возвращаем значение последнего nametest'а или же ''.
// Например, lastName(/foo/bar[id]) == 'bar', lastName(/) == ''.
asts.jpath.lastName = function() { // FIXME: Унести это в jpath_steps?
    var steps = this.Steps.p.Items;
    for (var i = steps.length; i--; ) {
        var step = steps[i];
        if ( step.is('jpath_nametest') ) {
            return step.p.Name;
        }
    }
    return '';
};

asts.jpath.getScope = function() {
    return this.Steps.getScope();
};

asts.jpath.w_extractDefs = function() {
    //  Каноническая запись jpath.
    var key = this.yate();

    var state = this.state;
    //  scope, в котором этот jpath имеет смысл.
    //  Например, .foo.bar[ .count > a + b ] имеет смысл только внутри scope'а,
    //  в котором определены переменные a и b.
    var scope = this.getScope();

    //  Если этот jpath еще не хранится в scope, то добаляем его туда.
    var jid = scope.jkeys[key];
    if (jid === undefined) {
        jid = scope.jkeys[key] = state.jid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.Id = jid;
    this.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_steps
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_steps = {};

asts.jpath_steps.options = {
    mixin: 'items'
};

asts.jpath_steps.jssep__ = ', ';


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_dots
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_dots = {};

asts.jpath_dots.options = {
    props: 'Dots'
};

asts.jpath_dots.w_action = function() {
    this.Length = this.Dots.length - 1;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_predicate
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_predicate = {};

asts.jpath_predicate.options = {
    props: 'Expr'
};

asts.jpath_predicate.getScope = function() {
    if ( this.isLocal() ) {
        return this.Expr.getScope();
    } else {
        //  FIXME: Временный костыль. Выражение .item[ /.index ] должно быть индексом,
        //  но из-за того, что оно глобальное, оно уезжает в глобальный scope.
        //  А индексы у меня сейчас не предусмотрены глобальные, т.к. там выражение
        //  явно генерится, без функциональной обертки.
        return this.scope;
    }
};

asts.jpath_predicate.isLocal = function() {
    return this.Expr.isLocal();
};

asts.jpath_predicate.isMatchable = function() {
    return this.Expr.isLocal() || this.Expr.getType() === 'boolean';
};

asts.jpath_predicate.w_setTypes = function() {
    if (this.isLocal() || this.Expr.getType() === 'boolean') {
        //  .items[ .count ] -- Expr является значением, зависящим от контекста. Это предикат.
        this.Expr.cast('boolean');
    } else {
        //  .items[ count ] -- Expr не зависит от контекста. Это индекс.
        this.Expr.cast('scalar');
    }
};

asts.jpath_predicate.w_extractDefs = function() {
    //  Каноническая запись предиката.
    var key = this.Expr.yate();

    var state = this.state;
    //  См. примечание в jpath.action().
    var scope = this.getScope();

    //  Если этот predicate еще не хранится в scope, то добаляем его туда.
    var pid = scope.pkeys[key];
    if (!pid) {
        pid = scope.pkeys[key] = state.pid++;
        scope.defs.push(this);
    }

    //  Запоминаем id-шник.
    this.Id = pid;
    this.Key = key;
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  jpath_filter
//  ---------------------------------------------------------------------------------------------------------------  //

asts.jpath_filter = {};

asts.jpath_filter.options = {
    base: 'inline_expr',
    props: 'Expr JPath'
};

asts.jpath_filter._init = function(params) {
    if (params) {
        this.Expr = params.expr;
        this.JPath = params.jpath;
    }
};

asts.jpath_filter._getType = no.value('nodeset');

asts.jpath_filter.isLocal = function() {
    return this.Expr.isLocal() || this.JPath.isLocal();
};

asts.jpath_filter.getScope = function() {
    return yate.Scope.commonScope( this.Expr.getScope(), this.JPath.getScope() );
};

asts.jpath_filter.w_prepare = function() {
    this.Expr.cast('nodeset');
};

asts.jpath_filter.w_validate = function() {
    if ( !this.Expr.getType('nodeset') ) {
        this.Expr.error('Type should be NODESET');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  simple_jpath
//  ---------------------------------------------------------------------------------------------------------------  //

asts.simple_jpath = {};

asts.simple_jpath.options = {
    base: 'inline_expr',
    props: 'Name JPath'
};

asts.simple_jpath._getType = no.value('nodeset');

asts.simple_jpath._init = function(jpath) {
    //  FIXME: А зачем тут хранится ссылка на jpath?
    this.JPath = jpath;
    this.Name = jpath.p.Steps.first().p.Name;
};

asts.simple_jpath.isLocal = function() {
    return this.JPath.isLocal();
};

asts.simple_jpath.getScope = function() {
    return this.JPath.getScope();
};


