// Поперто отсюда: https://github.com/Marak/colors.js

(function() {

var colors = {

    // Styles
    'bold'      : [1,  22],
    'italic'    : [3,  23],
    'underline' : [4,  24],
    'inverse'   : [7,  27],

    // Dark colors
    'gray'      : [30, 39],
    'maroon'    : [31, 39],
    'green'     : [32, 39],
    'olive'     : [33, 39],
    'navy'      : [34, 39],
    'purple'    : [35, 39],
    'teal'      : [36, 39],
    'silver'    : [37, 39],

    // Bright colors
    'black'     : [90, 39],
    'red'       : [91, 39],
    'lime'      : [92, 39],
    'yellow'    : [93, 39],
    'blue'      : [94, 39],
    'fuchsia'   : [95, 39],
    'aqua'      : [96, 39],
    'white'     : [97, 39]

};

for (var color in colors) {
    String.prototype.__defineGetter__(color, (function () {
        var _color = colors[color];
        return function() {
            return '\033[' + _color[0] + 'm' + this + '\033[' + _color[1] + 'm';
        }
    })());
}

})();

