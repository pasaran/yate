eval( require('fs').readFileSync(process.argv[2], 'utf-8') );
eval( require('fs').readFileSync(process.argv[3], 'utf-8') );

var r = Yater.run(data);

console.log(r);

