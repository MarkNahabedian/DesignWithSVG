// Javascript library for rendering text as vector graphics using
// Hershey fonts.

var EXPORTED_SYMBOLS = [ 'renderText' ];

// renderText adds a path element to parent for each character in text.
// font provides the SVG paths for the characters.
// kerning is a map from pairs or characters to additional X advance
// between them.
function renderText(parent, font, text, kerning={}) {
  var x = 0;
  var g = document.createElementNS(svgURI, 'g');
  parent.appendChild(g);
  g.setAttribute('transform', 'scale(' + (4 * 1.0/90)+ ')');
  g.appendChild(document.createComment(text));
  var previous = '';
  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    x += kerning[previous + char] || 0;
    var glyph = glyphLookup(font, char);
    if (!glyph ) {
      var err = 'No glyph for ' + char;
      console.log(err);
      g.appendChild(document.createComment(err));
      continue;
    }
    var path = document.createElementNS(svgURI, 'path');
    path.setAttribute('d', glyph.d);
    path.setAttribute('transform', 'translate(' + x + ', 0)');
    g.appendChild(path);
    x += glyph.o;
    previous = char;
  }
  return g;
}

function glyphLookup(font, character) {
  var glyphs = font.chars;
  var index = character.charCodeAt(0) - 33;
  if (index < 0 || index >= glyphs.length ) {
    return null;
  }
  return glyphs[index];
}
