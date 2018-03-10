// A javascript library for building up svg graphics programatically,
// primarily for design graphics for laser and CNC cutters.

svgURI = 'http://www.w3.org/2000/svg';
xlinkURI = 'http://www.w3.org/1999/xlink';

// setSVGNamespaces adds appropriate namespace attributes to each svg
// element of the current document.  setSVGNamespaces should be called
// once, perhaps just after the document is loaded.
function setSVGNamespaces() {
  var svgs = document.querySelectorAll("svg");
  for (var i = 0; i < svgs.length; ++i) {
    var svg = svgs[i];
    svg.setAttribute('xmlns', svgURI);
    svg.setAttribute('xmlns:xlink', xlinkURI);
  }
}

// setupSVGViewport sets the viewport related attributes of the
// specified svg element.
function setupSVGViewport(svgElt, x, y, width, height, units) {
  svgElt.setAttribute('x', '' + x);
  svgElt.setAttribute('y', '' + y);
  svgElt.setAttribute('width',   '' + width + units);
  svgElt.setAttribute('height',  '' + height + units);
  svgElt.setAttribute('viewBox', '' + x + ' ' + y + ' ' + width + ' ' + height);
}

// path adds an svg path element to parent and sets that path's d
// attribute to the specified dSpec.  dSpec can be an array of arrays
// of strings and numbers.  All will be joioned to form a single
// string as the d attribute value.
// This allows one to specify paths like
//  [ [ 'M', 10, 20], ['h' 5], ['v', 5]]
function path(parent, dSpec) {
  // console.log(dSpec);
  var p = document.createElementNS(svgURI, "path");
  if (parent != null) {
    parent.appendChild(p);
  }
  p.setAttribute('d',
      dSpec.map(function(piece) { return piece.join(' '); })
          .join('  '));
  return p;
}

// showSVG serializes svgElt to the <pre> element preElt so that the
// user can read or copy the svg code.
function showSVG(svgElt, preElt) {
  var serializer = new XMLSerializer();
  preElt.appendChild(document.createTextNode(
      serializer.serializeToString(svgElt)));
}
