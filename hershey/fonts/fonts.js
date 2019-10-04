// Javascript library for working with our Hershey font files.

var EXPORTED_SYMBOLS = [
    'fontCleanedUpFile',
    'fontKerningFile',
    'availableFonts',
    
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

function availableFonts(call_me_with_font_names_array) {
    var fonts = []
    var req = new XMLHttpRequest();
    var fontsURI = dirname(absURI()) + '/fonts.txt';
    req.addEventListener('load', function() {
	var got = req.responseText.split('\n');
	for(var i = 0; i < got.length; i++) {
	    if (got[i].length > 0) {
		fonts.push(got[i]);
	    }
	}
	call_me_with_font_names_array(fonts);
    });
    req.open('GET', fontsURI);
    req.send();
}

function dirname(path) {
    return path.split('/').slice(0, -1).join('/');
}

