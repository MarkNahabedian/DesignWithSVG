// Parameters and layout for DeWalt DW6184 fix base router sub-base
// playe mounting.

// Parameters and laout assume an origin point that is at the center
// of the router spindle.

// All dimensions are in inches.

var EXPORTED_SYMBOLS = [
    'BASE_DIAMETER', 'CENTER_HOLE_DIAMETER',
    'MH_DIAGONAL_DISTANCE', 'MH_XY_DELTA',
    'MH_DIAMETER', 'MH_COUNTERSINK_DIAMETER',
    'MH_COUNTERSINK_DEPTH',
    'dw6184_mounting_hole',
    'dw6184_center_home'
];


// This is the diameter of the metal base where it meets the sub-base
// plate.
var BASE_DIAMETER = 3.9385;

var CENTER_HOLE_DIAMETER = 1.1975;  // *** Measure again.  We should pick a diameter that works with our centering cone.

//Mounting holes for attaching the sub-base plate to the base:
var MH_DIAGONAL_DISTANCE = 3.6525;
var MH_XY_DELTA = (MH_DIAGONAL_DISTANCE / 2) * Math.cos(Math.PI / 4);
var MH_DIAMETER = 0.1770;    // Loose clearance for #8-36 machine screw
var MH_COUNTERSINK_DIAMETER = 0.3970;
var MH_COUNTERSINK_DEPTH = 0.1635;


// Generate an SVG circle in the specified XML parent element in the
// direction specified.  x_direction and y_direction should each be
// either 1 or -1.
function dw6184_mounting_hole(xml_parent, x_direction, y_direction) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + (MH_XY_DELTA * x_direction));
    hole.setAttribute('cy',   '' + (MH_XY_DELTA * y_direction));
    hole.setAttribute('r',   '' + (MH_DIAMETER / 2));
    inside_cut(hole);
    xml_parent.appendChild(hole);
}

function dw6184_center_hole(xml_parent) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + 0);
    hole.setAttribute('cy',   '' + 0);
    hole.setAttribute('r',   '' + (CENTER_HOLE_DIAMETER / 2));
    inside_cut(hole);
    xml_parent.appendChild(hole);
}

