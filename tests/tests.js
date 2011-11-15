module.exports = [

    {
        title: 'string interpolation',
        tests: [
            {
                description: 'string interpolation',
                yate: 'string-interpolation.01.yate',
                data: '01.json',
                result: 'Hello, nop'
            },
            {
                description: 'multiple string interpolations',
                yate: 'string-interpolation.02.yate',
                data: '01.json',
                result: 'Hello, nop! Your ID is 33662468'
            },
            {
                description: 'interpolation inside xml text',
                yate: 'string-interpolation.03.yate',
                data: '01.json',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'multiple interpolations inside xml text',
                yate: 'string-interpolation.07.yate',
                data: '01.json',
                result: '<h1>Hello, nop. Your ID is 33662468</h1>'
            },
            {
                description: 'interpolation inside xml',
                yate: 'string-interpolation.04.yate',
                data: '01.json',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'interpolation inside inline attribute',
                yate: 'string-interpolation.05.yate',
                data: '01.json',
                result: '<h1 class="b-hello b-hello-33662468">Hello, nop</h1>'
            },
            {
                description: 'multiple interpolations inside inline attribute',
                yate: 'string-interpolation.06.yate',
                data: '01.json',
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
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'xml attribute',
                yate: 'attributes.02.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'xml attribute replaces inline attribute',
                yate: 'attributes.03.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'add class to empty (undefined) class',
                yate: 'attributes.04.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'several attributes in variable',
                yate: 'attributes.05.yate',
                data: '01.json',
                result: '<h1 class="b-hello" id="33662468">Hello, nop</h1>'
            },
            {
                description: 'several attributes in if',
                yate: 'attributes.06.yate',
                data: '01.json',
                result: '<h1 class="b-hello" id="33662468">Hello, nop</h1>'
            },
            {
                description: 'attributes in for',
                yate: 'attributes.07.yate',
                data: '01.json',
                result: '<h1 class="b-hello b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attributes in apply',
                yate: 'attributes.08.yate',
                data: '01.json',
                result: '<h1 class="b-hello b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attributes in nested applies',
                yate: 'attributes.09.yate',
                data: '01.json',
                result: '<h1 class="b-hello b-items b-first b-second b-third">Hello, nop</h1>'
            },
            {
                description: 'attribute inside scalar block',
                yate: 'attributes.10.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'attribute in the beginning of block block',
                yate: 'attributes.11.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },

        ]
    },

    {
        title: 'escaping',
        tests: [
            {
                description: 'escape inline attribute',
                yate: 'escaping.01.yate',
                data: '01.json',
                result: '<h1 class="b-hello &quot;Some &lt;b&gt;&amp;attribute&lt;/b&gt;&quot;">Hello, nop</h1>'
            },
            {
                description: 'escape text',
                yate: 'escaping.02.yate',
                data: '01.json',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
            {
                description: 'escape text inside interpolation',
                yate: 'escaping.04.yate',
                data: '01.json',
                result: '&lt;b&gt;Some &amp;text&lt;/b&gt;'
            },
            {
                description: 'escape xml text',
                yate: 'escaping.03.yate',
                data: '01.json',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
        ]
    },

    {
        title: 'variables',
        tests: [
            {
                description: 'variable with scalar block value',
                yate: 'variables.01.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'variable with if value',
                yate: 'variables.02.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>'
            },
            {
                description: 'variable with for value',
                yate: 'variables.03.yate',
                data: '01.json',
                result: '<ul><li class="b-first">First</li><li class="b-second">Second</li><li class="b-third">Third</li></ul>'
            },
            {
                description: 'variable with if value, type nodeset',
                yate: 'variables.04.yate',
                data: '01.json',
                result: '<ul><li class="b-first">First</li><li class="b-second">Second</li><li class="b-third">Third</li></ul>'
            },
            {
                description: 'variable with nodeset block value',
                yate: 'variables.05.yate',
                data: '01.json',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'variable with attribute value can be used multiple times',
                yate: 'variables.06.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1><h1 class="b-hello">Bye, nop</h1>'
            },
            {
                description: 'variable with xml value',
                yate: 'variables.07.yate',
                data: '01.json',
                result: '<h1>Hello, nop</h1>'
            },
            {
                description: 'using attribute-typed variable several times doesn\'t multiply attributes',
                yate: 'variables.08.yate',
                data: '01.json',
                result: '<h1 class="b-hello">Hello, nop</h1>',
                known: true
            },
            {
                description: 'variable can be redefined in internal scope and restored back',
                yate: 'variables.09.yate',
                data: '01.json',
                result: '<h1>Hello, nop</h1><h1>Hello, unknown</h1>'
            },
        ]
    },

    {
        title: 'functions',
        tests: [
            {
                description: 'function returning nodeset',
                yate: 'functions.01.yate',
                data: '01.json',
                result: '<ul><li>First</li><li>Second</li><li>Third</li></ul>'
            },
            {
                description: 'function returning empty nodeset',
                yate: 'functions.04.yate',
                data: '01.json',
                result: ''
            },
            {
                description: 'function returning boolean',
                yate: 'functions.02.yate',
                data: '01.json',
                result: '<div>Ok</div><div>Valid</div>'
            },
            {
                description: 'function returning default boolean value (false)',
                yate: 'functions.05.yate',
                data: '01.json',
                result: '<div>Error</div>'
            },
            {
                description: 'function returning xml',
                yate: 'functions.03.yate',
                data: '01.json',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            },
            {
                description: 'function with 2 scalar params',
                yate: 'functions.06.yate',
                data: '01.json',
                result: '66'
            },
        ]
    },

    {
        title: 'keys',
        tests: [
            {
                description: 'xslt-styled key',
                yate: 'keys.01.yate',
                data: '01.json',
                result: 'First'
            },
        ]
    },

    {
        title: 'if',
        tests: [
            {
                description: 'if with else',
                yate: 'if.01.yate',
                data: '01.json',
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
                data: '01.json',
                result: 'String with "double quotes" and \'single quotes\'',
                known: true
            },
        ]
    },

    {
        title: 'misc',
        tests: [
            {
                description: 'string concatenation via +',
                yate: 'misc.01.yate',
                data: '01.json',
                result: '<h1>Hello, nop</h1>'
            },
        ]
    },

];

