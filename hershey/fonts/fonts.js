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
    fetch(fURI).then(function(response) {
        if (!response.ok) {
            console.log(response.statusText);
            return;
        }
        response.text().then(
            function(txt) {
                var fonts = [];
                var split = txt.split('\n');
                for (var i = 0; i < split.length; i++) {
                    var font = split[i];
                    if (font.length > 0) {
                        fonts.push(font);
                    }
                }
                fonts_array_callback(fonts)
            },
            console.log);
    });
}



