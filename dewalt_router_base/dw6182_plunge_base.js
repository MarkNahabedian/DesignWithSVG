// Parameters and layout for DeWalt DW6182 plunge base router sub-base
// mounting.

// Parameters and layout assume an origin point that is at the center
// of the router spindle.

// All dimensions are in inches.

var EXPORTED_SYMBOLS = [
    'dw6182_mounting_hole'
];


var BASE_TOTAL_WIDTH = 5.7875;
var BASE_TOTAL_DEPTH = 4.42;

var CENTER_HOLE_DIAMETER = 1.1975;


//Mounting holes for attaching the sub-base plate to the base:
var MH_LONG_DISTANCE = (3.2865 + 2.91) / 2;
var MH_SHORT_DISTANCE = (2.415 + 2.8025) / 2;
var MH_DIAMETER = 0.1770;    // Loose clearance for #8-36 machine screw


// dw6182_base_extent returns a rectangle that bounds the outer edge
// of the metal DW6182 router base.
function dw6182_base_extent(xml_parent) {
    var dx = BASE_TOTAL_WIDTH / 2;
    var dy = BASE_TOTAL_DEPTH / 2;
    var bounds = path(xml_parent, [
        ['M', -dx, -dy],
        ['H', dx],
        ['V', dy],
        ['H', -dx],
        ['z']
    ]);
    guide_line(bounds);
    xml_parent.appendChild(bounds);
}


// Generate an SVG circle in the specified XML parent element in the
// direction specified.  x_direction and y_direction should each be
// either 1 or -1.  The resulting circle represents a single mounting
// hole for connecting the plate to the router base.
function dw6182_mounting_hole(xml_parent, x_direction, y_direction) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + (x_direction * MH_LONG_DISTANCE / 2));
    hole.setAttribute('cy',   '' + (y_direction * MH_SHORT_DISTANCE / 2));
    hole.setAttribute('r',   '' + (MH_DIAMETER / 2));
    inside_cut(hole);
    xml_parent.appendChild(hole);
}
