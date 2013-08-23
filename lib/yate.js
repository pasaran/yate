var fs_ = require('fs');
var path_ = require('path');

var nopt = require('nopt');

//  ---------------------------------------------------------------------------------------------------------------  //

var Compiler = require('./compiler.js');

//  ---------------------------------------------------------------------------------------------------------------  //

function Yate(options) {
    this.options = prepare_options( options || get_options() );

    this.compiler = new Compiler({
        include_dir: this.options.include_dir
    });
}

//  ---------------------------------------------------------------------------------------------------------------  //

function get_options() {
    var options = nopt(
        {
            'help': Boolean,
            'version': Boolean,
            'ast_before': Boolean,
            'ast_after': Boolean,
            'print': Boolean,

            'mode': String,
            'data': String,
            'external': [ Array, path_ ],
            'target': String,
            'stdout': Boolean,
            'include-dir': [ Array, path_ ],
        },
        {
            'p': '--print',
            'm': '--mode',
            'e': '--external',
            'a': '--ast_before',
            'ast': '--ast_before',
            'v': '--version',
            'I': 'include-dir',
            'node': [ '--target', 'node' ],
        }
    );

    var remain = options.argv.remain;

    if ( is_yate(remain) ) {
        options.files = remain;

    } else {
        var arg0 = remain[0];
        if ( !is_yate(arg0) ) {
            return this.help();
        }
        options.files = [ arg0 ];

        options.data = remain[1];

        if ( remain.length > 2 ) {
            return this.help();
        }
    }

    return options;
};

function is_yate(s) {
    if ( Array.isArray(s) ) {
        for (var i = 0, l = s.length; i < l; i++) {
            if ( !is_yate( s[i] ) ) {
                return false;
            }
        }
        return true;
    }

    return /\.yate$/.test(s);
}

function prepare_options(options) {
    options.include_dir = options.include_dir || [];
    options.include_dir.push( path_.resolve('.') );

    var files = options.files;
    for (var i = 0, l = files.length; i < l; i++) {
        files[i] = path_.resolve( '.', files[i] );
    }

    var data = options.data;
    if (data) {
        options.target = 'node';

        if ( typeof data === 'string' ) {
            if ( data.charAt(0) === '{' || data.charAt(0) === '[' ) {
                options.data = eval( '(' + data + ')' );
            } else {
                options.data = eval( '(' + fs_.readFileSync(data, 'utf-8') + ')' );
            }
        }
    }

    return options;
}

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.work = function() {
    var options = this.options;

    if (options.help) {
        this.help();

    } else if (options.version) {
        this.version();

    } else if (options.print) {
        this.print();

    } else if (options.data) {
        this.run();

    } else if (options.ast_before || options.ast_after) {
        this.ast();

    } else if (options.files.length) {
        this.compile();

    } else {
        this.help();

    }

    this.compiler.unwatch();
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.help = function() {
    console.log( fs_.readFileSync(__dirname + '/usage.txt', 'utf-8') );

    process.exit(1);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.version = function() {
    console.log( require('../package.json').version );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.print = function() {
    var options = this.options;

    var filename = options.files[0];

    var ast = this.compiler.parse(filename);

    console.log( ast.yate() );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.ast = function() {
    var options = this.options;

    var filename = options.files[0];
    var ast = (options.ast_after) ? this.compiler.ast_after(filename) : this.compiler.ast_before(filename);

    console.log( ast.toString() );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.run = function() {
    var options = this.options;

    var filename = options.files[0];
    this.compile(filename);

    var module_name = filename + '.node.js';
    var module = require(module_name);

    var result = module(options.data, options.mode);

    console.log(result);
};

//  ---------------------------------------------------------------------------------------------------------------  //

Yate.prototype.compile = function() {
    var options = this.options;

    var params = {
        include_dir: options.include_dir,
        target: options.target
    };

    var is_node = (options.target === 'node');

    var files = options.files;
    for (var i = 0, l = files.length; i < l; i++) {
        var filename = files[i];

        var js = this.compiler.compile(filename, params);

        if (options.stdout) {
            console.log(js);
        } else {
            var outname = filename + ( (is_node) ? '.node.js' : '.js' );
            fs_.writeFileSync(outname, js, 'utf-8');
        }
    }
};

// ----------------------------------------------------------------------------------------------------------------- //

module.exports = Yate;

//  ---------------------------------------------------------------------------------------------------------------  //

