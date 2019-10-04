// Javascript library for working with our Hershey font files.

var EXPORTED_SYMBOLS = [
    'fontCleanedUpFile',
    'fontKerningFile',
    'availableFonts'
];

function fontCleanedUpFile(fontname) {
    return fontname + '-cleaned_up.json';
}

function fontKerningFile(fontname) {
    return fontname + '.kerning';
}

function absURI(relative) {
    if (!relative) {
	return document.documentURI;
    }
    return document.documentURI + '/' + relative;
}

function availableFonts() {
    var req = new XMLHttpRequest();
    var fontsURI = dirname(absURI()) + '/fonts.txt';
    req.addEventListener('load', function() {
	console.log(this.responseText);
    });
    req.open('GET', fontsURI);
    req.send();
}

function dirname(path) {
    return path.split('/').slice(0, -1).join('/');
}

