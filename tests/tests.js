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
            }
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
                description: 'escape xml text',
                yate: 'escaping.03.yate',
                data: '01.json',
                result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
            }
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
            }
        ]
    }
];

