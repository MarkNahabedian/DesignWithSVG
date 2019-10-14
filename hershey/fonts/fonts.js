// Javascript library for working with our Hershey font files.

var EXPORTED_SYMBOLS = [
    'fontCleanedUpFile',
    'fontKerningFile',
    'availableFonts',
    'fontsURI'
];

function fontCleanedUpFile(fontname) {
    return fontname + '-cleaned_up.json';
}

function fontKerningFile(fontname) {
    return fontname + '.kerning';
}

function fontsURI() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src;
        var split = src.split('/');
        if (split[split.length - 1] == 'fonts.js') {
            return split.slice(0, -1).join('/');
        }
    }
    return null;
}

function availableFonts(fonts_array_callback) {
    var fURI = fontsURI() + '/fonts.txt';
    console.log(fURI);
    fetch(fURI).then(function(response) {
        if (!response.ok) {
            console.log(response.statusText);
            return;
        }
        response.body.text().then(
            function(txt) {
                fonts_array_callback(txt.split('\n'))
            },
            console.log);
    });
}



