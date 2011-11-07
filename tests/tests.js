module.exports = [
    {
        description: 'string interpolation',
        yate: '01.yate',
        data: '01.json',
        result: 'Hello, nop'
    },
    {
        description: 'xml text interpolation',
        yate: '03.yate',
        data: '01.json',
        result: '<h1>Hello, nop</h1>'
    },
    {
        description: 'string interpolation inside xml',
        yate: '02.yate',
        data: '01.json',
        result: '<h1>Hello, nop</h1>'
    },
    {
        description: 'string concatenation via +',
        yate: '04.yate',
        data: '01.json',
        result: '<h1>Hello, nop</h1>'
    },
    {
        description: 'inline attribute',
        yate: '05.yate',
        data: '01.json',
        result: '<h1 class="b-hello">Hello, nop</h1>'
    },
    {
        description: 'xml attribute',
        yate: '06.yate',
        data: '01.json',
        result: '<h1 class="b-hello">Hello, nop</h1>'
    },
    {
        description: 'xml attribute replaces inline attribute',
        yate: '07.yate',
        data: '01.json',
        result: '<h1 class="b-hello">Hello, nop</h1>'
    },
    {
        description: 'string interpolation in inline attribute',
        yate: '08.yate',
        data: '01.json',
        result: '<h1 class="b-hello b-hello-33662468">Hello, nop</h1>'
    },
    {
        description: 'quoted interpolation inside inline attribute',
        yate: '09.yate',
        data: '01.json',
        result: '<h1 class="b-hello &quot;Some &lt;b&gt;&amp;attribute&lt;/b&gt;&quot;">Hello, nop</h1>'
    },
    {
        description: 'quoted xml text',
        yate: '10.yate',
        data: '01.json',
        result: '<h1>&lt;b&gt;Some &amp;text&lt;/b&gt;</h1>'
    },
];

