var asts = require('./asts.js');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //
//
//  xml:
//
//    * xmw
//    * xml_line
//    * xml_start
//    * xml_end
//    * xml_empty
//    * xml_text
//    * xml_full
//    * xml_attrs
//    * xml_attr
//
//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml = {};

asts.xml.options = {
    base: 'expr'
};

asts.xml._getType = no.value('xml');


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_line
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_line = {};

asts.xml_line.options = {
    base: 'xml',
    mixin: 'items'
};

asts.xml_line.wellFormed = function(opened) {
    var that = this;

    this.iterate(function(item) {
        if (item.is('xml_start')) {
            opened.push(item.p.Name);
        } else if (item.is('xml_end')) {
            var name = opened.pop();
            if (!name) {
                //  FIXME: Если p.Name === true, будет не очень внятное сообщение об ошибке.
                that.error('Закрывающий тег </' + item.p.Name + '> не был предварительно открыт');
            } else if ( (item.p.Name !== name) && (item.p.Name !== true) ) {
                that.error('Невалидный XML. Ожидается </' + name + '>');
            }
            //  FIXME: Не очень подходящее место для этого действия.
            //  Лучше бы унести это в какой-то .action().
            item.p.Name = name;
        }
    });
};

asts.xml_line.opens = function() {
    return !!this.lastTag();
};

asts.xml_line.lastTag = function() {
    var last = this.last();
    if ( last.is('xml_start') ) {
        return last;
    }
};

asts.xml_line.js__content = function() {
    var items = [];
    this.toResult(items);

    var r = [];
    var s = '';
    for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (typeof item == 'string') {
            s += item;
        } else {
            if (s) {
                r.push(s);
                s = '';
            }
            r.push(item); // FIXME: item -> make('string_literal')
        }
    }
    if (s) {
        r.push(s); // FIXME:
    }

    for (var i = 0, l = r.length; i < l; i++) {
        var item = r[i];
        if (typeof item == 'string') {
            r[i] = JSON.stringify(item);
        } else {
            r[i] = item.js();
        }
    }

    return r.join(' + ') || "''"; // FIXME: В случае, когда xml_line состоит из одного, скажем, </img>, должна выводиться хотя бы пустая строка.
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_start
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_start = {};

asts.xml_start.options = {
    base: 'xml',
    props: 'Name Attrs'
};

asts.xml_start._init = function(ast) {
    this.Name = ast.Name;
    this.Attrs = ast.Attrs;
};

asts.xml_start.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    if (!this.open) {
        this.Attrs.toResult(result);
        result.push( (yate.consts.shortTags[name]) ? '/>' : '>' );
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_end
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_end = {};

asts.xml_end.options = {
    base: 'xml',
    props: 'Name'
};

asts.xml_end.w_action = function() {
    if ( yate.consts.shortTags[this.Name] ) {
        this.f.Short = true;
    }
};

asts.xml_end.toResult = function(result) {
    if (!this.f.Short) {
        result.push('</' + this.Name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_empty
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_empty = {};

asts.xml_empty.options = {
    base: 'xml',
    props: 'Name Attrs'
};

asts.xml_empty.toResult = function(result) {
    var name = this.Name;

    result.push('<' + name);
    this.Attrs.toResult(result);
    if ( yate.consts.shortTags[name] ) {
        result.push('/>');
    } else {
        result.push('></' + name + '>');
    }
};


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_text
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_text = {};

asts.xml_text.options = {
    base: 'xml',
    props: 'Text'
};

asts.xml_text.oncast = function(to) {
    this.Text.cast(to);
};

asts.xml_text.toResult = function(result) {
    this.Text.toResult(result);
};


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_full
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_full = {};

asts.xml_full.options = {
    base: 'xml',
    mixin: 'items'
};
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attrs
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attrs = {};

asts.xml_attrs.options = {
    mixin: 'items'
};

asts.xml_attrs.jssep__open = ',\n';


//  ---------------------------------------------------------------------------------------------------------------  //
//  xml_attr
//  ---------------------------------------------------------------------------------------------------------------  //

asts.xml_attr = {};

asts.xml_attr.options = {
    props: 'Name Value'
};

asts.xml_attr.toResult = function(result) {
    result.push(' ' + this.Name + '="');
    this.Value.toResult(result);
    result.push('"');
};

asts.xml_attr.w_prepare = function() {
    //  FIXME: Как бы не ходить по дереву так уродливо?
    //  Ответ: Сделать это в attrs_open?
    if ( !this.parent.parent.is('attrs_open') ) {
        this.Value.cast('attrvalue');
    } else {
        this.Value.cast('scalar');
    }
};


