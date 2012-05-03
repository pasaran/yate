module.exports = [

    {
        title: 'match',
        tests: [
            {
                description: 'predicate in match',
                yate: 'match.01.yate',
                result: '<ul><li>First</li><li class="disabled">Second</li><li>Third</li></ul>'
            },
        ]
    },

    {
        title: 'string interpolation',
        tests: [
            {
                description: 'string interpolation',
                yate: 'string-interpolation.01.yate',
                result: 'Hello, nop'
            },
            {
                description: 'multiple string interpolations',
                yate: 'string-interpolation.02.yate',
                result: 'Hello, nop! Your ID is 33662468'
            },
            {
                description: 'interpolation inside xml text',
                yate: 'string-interpolation.03.yate',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'multiple interpolations inside xml text',
                yate: 'string-interpolation.07.yate',
                result: '<h1>Hello, nop. Your ID is 33662468</h1>'
            },
            {
                description: 'interpolation inside xml',
                yate: 'string-interpolation.04.yate',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'interpolation inside inline attribute',
                yate: 'string-interpolation.05.yate',
                result: '<h1 class="b-hello b-hello-33662468">Hello, nop</h1>'
            },
            {
                description: 'multiple interpolations inside inline attribute',
                yate: 'string-interpolation.06.yate',
                result: '<h1 class="b-hello b-hello-nop b-hello-33662468">Hello, nop</h1>'
            },
        ]
    },

    {
        title: 'xml attribute',
        tests: [
            {
                description: 'inline attribute',
                yate: 'attributes.01.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'xml attribute',
                yate: 'attributes.02.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'xml attribute replaces inline attribute',
                yate: 'attributes.03.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'add class to empty (undefined) class',
                yate: 'attributes.04.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'several attributes in variable',
                yate: 'attributes.05.yate',
                result: '<h1 class="b-hello" id="33662468">Hello, nop</h1>'
            },
            {
                description: 'several attributes in if',
                yate: 'attributes.06.yate',
                result: '<h1 class="b-hello" id="33662468">Hello, nop</h1>'
            },
            {
                description: 'attributes in for',
                yate: 'attributes.07.yate',
                result: '<h1 class="b-hello b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attributes in apply',
                yate: 'attributes.08.yate',
                result: '<h1 class="b-hello b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attributes in nested applies',
                yate: 'attributes.09.yate',
                result: '<h1 class="b-hello b-items b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attribute inside scalar block',
                yate: 'attributes.10.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'attribute in the beginning of block block',
                yate: 'attributes.11.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'add conditional class to empty (undefined) class',
                yate: 'attributes.12.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'result of apply as an attribute\'s value',
                yate: 'attributes.13.yate',
                result: '<div class="b-hello">Hello</div>'
            },
            {
                description: 'result of apply as an inline attribute\'s value',
                yate: 'attributes.14.yate',
                result: '<div class="b-hello">Hello</div>',
                known: true
            },
            {
                description: 'missed nodeset2scalar for attribute',
                yate: 'attributes.15.yate',
                result: '<div id="33662468" class="b-hello">Hello</div>'
            },
            {
                description: 'attribute with false value (e.g. 0)',
                yate: 'attributes.16.yate',
                result: '<div zero="0">Hello</div>',
                known: true
            },

        ]
    },

    {
        title: 'escaping',
        tests: [
            {
                description: 'escape inline attribute',
                yate: 'escaping.01.yate',
                result: '<h1 class="b-hello &quot;Some &lt;b&gt;&amp;attribute&lt;/b&gt;&quot;">Hello, nop</h1>'
            },
            {
                description: 'escape text',
                yate: 'escaping.02.yate',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
            {
                description: 'escape xml text',
                yate: 'escaping.03.yate',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
            {
                description: 'escape text inside interpolation',
                yate: 'escaping.04.yate',
                result: '&lt;b&gt;Some &amp;text&lt;/b&gt;'
            },
            {
                description: 'attributes overescaping',
                yate: 'escaping.05.yate',
                result: '<tag a="&lt;" b="&lt;" c="&lt;"></tag><tag a="&amp;" b="&amp;" c="&amp;"></tag>' +
                        '<tag a="&lt;" b="&lt;"></tag><tag a="&amp;" b="&amp;"></tag>'
            },
            {
                description: 'escape literal text',
                yate: 'escaping.06.yate',
                result: '<div>A &gt; 0 &amp;&amp; B &lt; "0"</div><div>A &gt; 0 &amp;&amp; B &lt; "0"</div>'
            },
            {
                description: "don't escape html-entities",
                yate: 'escaping.07.yate',
                result: '<div title="Hello A &amp; B. I &hearts;&nbsp;NY. 1&#8212;2&#x7c;3." ' +
                        'subtitle="Hello A &amp; B. I &hearts;&nbsp;NY. 1&#8212;2&#x7c;3.">' +
                        'Hello A &amp; B. I &hearts;&nbsp;NY. 1&#8212;2&#x7c;3.' +
                        'Hello A &amp; B. I &hearts;&nbsp;NY. 1&#8212;2&#x7c;3.</div>'
            },
        ]
    },

    {
        title: 'variables',
        tests: [
            {
                description: 'variable with scalar block value',
                yate: 'variables.01.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'variable with if value',
                yate: 'variables.02.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'variable with for value',
                yate: 'variables.03.yate',
                result: '<ul><li class="b-first">First</li><li class="b-second">Second</li><li class="b-third">Third</li></ul>'
            },
            {
                description: 'variable with if value, type nodeset',
                yate: 'variables.04.yate',
                result: '<ul><li class="b-first">First</li><li class="b-second">Second</li><li class="b-third">Third</li></ul>'
            },
            {
                description: 'variable with nodeset block value',
                yate: 'variables.05.yate',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'variable with attribute value can be used multiple times',
                yate: 'variables.06.yate',
                result: '<h1 class="b-hello">Hello, nop</h1><h1 class="b-hello">Bye, nop</h1>'
            },
            {
                description: 'variable with xml value',
                yate: 'variables.07.yate',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'using attribute-typed variable several times doesn\'t multiply attributes',
                yate: 'variables.08.yate',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'variable can be redefined in internal scope and restored back',
                yate: 'variables.09.yate',
                result: '<h1>Hello, nop</h1><h1>Hello, unknown</h1>'
            },
            {
                description: 'global non-constant variable',
                yate: 'variables.10.yate',
                result: 'FirstSecondThird'
            },
        ]
    },

    {
        title: 'functions',
        tests: [
            {
                description: 'function returning nodeset',
                yate: 'functions.01.yate',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'function returning empty nodeset',
                yate: 'functions.04.yate',
                result: ''
            },
            {
                description: 'function returning boolean',
                yate: 'functions.02.yate',
                result: '<div>Ok</div><div>Valid</div>'
            },
            {
                description: 'function returning default boolean value (false)',
                yate: 'functions.05.yate',
                result: '<div>Error</div>'
            },
            {
                description: 'function returning xml',
                yate: 'functions.03.yate',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
            {
                description: 'function with 2 scalar params',
                yate: 'functions.06.yate',
                result: '66'
            },
            {
                description: 'function with 2 scalar params, one of them with default value',
                yate: 'functions.07.yate',
                result: '66'
            },
            {
                description: 'function call preserves current context',
                yate: 'functions.08.yate',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'external function',
                yate: 'functions.09.yate',
                externals: 'functions.09.js',
                result: '<ul><li>Third</li><li>Second</li><li>First</li></ul>'
            },
            {
                description: 'disable output escaping',
                yate: 'functions.10.yate',
                result: '&lt;i&gt;Hello, &lt;b&gt;nop&lt;/b&gt;&lt;/i&gt;<i>Hello, <b>nop</b></i>'
            },
            {
                description: 'empty string as function param',
                yate: 'functions.11.yate',
                result: '<a href="http://www.yandex.ru">Яндекс</a><a href="http://www.yandex.ru">Яндекс</a><a href="http://www.yandex.ru" class="b-link">Яндекс</a>'
            },
            {
                description: 'return value of function returning attributes saved in variable',
                yate: 'functions.12.yate',
                result: '<div class="b-hello" id="hello">Hello</div>',
                known: true
            },
            {
                description: 'external function returning attributes',
                yate: 'functions.13.yate',
                externals: 'functions.13.js',
                result: '<div class="b-hello" id="hello">Hello</div>',
                known: true
            },
            {
                description: 'functions with the same params',
                yate: 'functions.14.yate',
                result: '<h1>Hello</h1>'
            },
            {
                description: 'functions with the nodeset param',
                yate: 'functions.15.yate',
                result: 'zeroonetwo'
            },
        ]
    },

    {
        title: 'keys',
        tests: [
            {
                description: 'xslt-styled key',
                yate: 'keys.01.yate',
                result: 'First'
            },
            {
                description: 'key with xml-typed values',
                yate: 'keys.02.yate',
                result: '<ul><li class="b-item-first">First</li><li class="b-item-second">Second</li><li class="b-item-third">Third</li></ul><ul><li class="b-item-first">First</li><li class="b-item-second">Second</li><li class="b-item-third">Third</li></ul>'
            },
        ]
    },

    {
        title: 'if',
        tests: [
            {
                description: 'if with else',
                yate: 'if.01.yate',
                result: '<h1>nop is valid</h1><h1>nop is valid</h1>'
            },
        ]
    },

    {
        title: 'strings',
        tests: [
            {
                description: 'string with different quotes',
                yate: 'strings.01.yate',
                result: 'String with "double quotes" and \'single quotes\'String with "double quotes" and \'single quotes\''
            },
            {
                description: 'empty string',
                yate: 'strings.02.yate',
                result: ''
            },
            {
                description: 'empty string in variable',
                yate: 'strings.03.yate',
                result: ''
            },
            {
                description: 'single and double quoted strings',
                yate: 'strings.04.yate',
                result: 'Hello, nopHello, nop'
            },
        ]
    },

    {
        title: 'jpaths',
        tests: [
            {
                description: 'basic arithmetic operations',
                yate: 'jpaths.01.yate',
                result: '<div>66</div><div>18</div><div>126</div><div>7</div>'
            },
            {
                description: 'parent selector',
                yate: 'jpaths.02.yate',
                result: 'flags'
            },
            {
                description: 'parent selector of array\s items',
                yate: 'jpaths.03.yate',
                result: 'itemsitemsitems'
            },
            {
                description: '. expression',
                yate: 'jpaths.04.yate',
                result: 'FirstSecondThird'
            },
            {
                description: 'apply . #mode',
                yate: 'jpaths.05.yate',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'apply ..... #name',
                yate: 'jpaths.06.yate',
                result: 'blocksappcontentuserleft'
            },
            {
                description: 'index() and count() in predicate',
                yate: 'jpaths.07.yate',
                result: '01234'
            },
            {
                description: 'index() in second predicate',
                yate: 'jpaths.08.yate',
                result: 'foursixeight'
            },
            {
                description: 'join doesn\'t preserve order',
                yate: 'jpaths.09.yate',
                result: 'fivesixseveneightninezeroonetwothreefour'
            },
            {
                description: 'join doesn\'t remove duplicate nodes',
                yate: 'jpaths.10.yate',
                result: 'nopnopnop'
            },
            {
                description: '* selector',
                yate: 'jpaths.11.yate',
                result: 'blocksappcontentuserleftright'
            },
            {
                description: 'simple absolute jpath',
                yate: 'jpaths.12.yate',
                result: 'nop'
            },
        ]
    },

    {
        title: 'xml',
        tests: [
            {
                description: 'short tag with attr inside',
                yate: 'xml.01.yate',
                result: '<img src="0.png" width="100" height="100" class="b-image"/>'
            },
            {
                description: 'empty short tag (xml-style)',
                yate: 'xml.02.yate',
                result: '<img src="0.png" width="100" height="100"/>'
            },
            {
                description: 'empty short tag (xml-style)',
                yate: 'xml.05.yate',
                result: '<img src="0.png" width="100" height="100"/>'
            },
            {
                description: 'short tag with attr and text inside',
                yate: 'xml.03.yate',
                result: '<img src="0.png" width="100" height="100" class="b-hello"/>Hello'
            },
            {
                description: 'short tag with text inside',
                yate: 'xml.04.yate',
                result: '<img src="0.png" width="100" height="100"/>Hello'
            },
            {
                description: 'nested short tags',
                yate: 'xml.06.yate',
                result: '<img src="1.png"/><img src="2.png" class="b-hello"/>Hello, World'
            },
            {
                description: 'expand non-short tags',
                yate: 'xml.07.yate',
                result: '<div class="b-hello"></div>'
            },
            {
                description: 'single and double quoted attributes',
                yate: 'xml.08.yate',
                result: '<div class="b-hello" title="nop">Hello</div><div class="b-hello" title="nop">Hello</div>'
            },
            {
                description: '</> as a universal closing tag',
                yate: 'xml.09.yate',
                result: '<div>Hello</div><div>Hello</div><b><i>nop</i></b>'
            },
        ]
    },

    {
        title: 'includes',
        tests: [
            {
                description: 'include with relative paths',
                yate: 'includes.01.yate',
                result: 'Hello, nop'
            },
        ]
    },

    {
        title: 'misc',
        tests: [
            {
                description: 'string concatenation via +',
                yate: 'misc.01.yate',
                result: '<h1>Hello, nop</h1>'
            },
        ]
    },

];

