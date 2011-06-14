// Поперто отсюда: https://github.com/Marak/colors.js

(function() {

var colors = {

    'bold'      : [1,  22],
    'italic'    : [3,  23],
    'underline' : [4,  24],
    'inverse'   : [7,  27],
    'red'       : [31, 39],
    'green'     : [32, 39],
    'yellow'    : [33, 39],
    'blue'      : [34, 39],
    'magenta'   : [35, 39],
    'cyan'      : [36, 39],
    'white'     : [37, 39],
    'grey'      : [90, 39],
    'black'     : [90, 39]

};

for (var color in colors) {
    String.prototype.__defineGetter__(color, (function () {
        var _color = color;
        return function() {
            return '\033[' + colors[_color][0] + 'm' + this + '\033[' + colors[_color][1] + 'm';
        }
    })());
}

})();

