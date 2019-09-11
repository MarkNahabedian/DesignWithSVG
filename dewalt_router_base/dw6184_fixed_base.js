// Parameters and layout for DeWalt DW6184 fixed base router sub-base
// mounting.

// Parameters and layout assume an origin point that is at the center
// of the router spindle.

// All dimensions are in inches.

var EXPORTED_SYMBOLS = [
    'BASE_DIAMETER', 'CENTER_HOLE_DIAMETER',
    'MH_DIAGONAL_DISTANCE', 'MH_XY_DELTA',
    'MH_DIAMETER', 'MH_COUNTERSINK_DIAMETER',
    'MH_COUNTERSINK_DEPTH',
    'dw6184_base_perimeter',
    'dw6184_mounting_hole',
    'dw6184_center_hole'
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


// dw6184_base_perimeter Returns the circle that bounds the outer edge
// of the metal DW6184 router base.
function dw6184_base_perimeter(xml_parent) {
    var perimeter = document.createElementNS(svgURI, 'circle');
    perimeter.setAttribute('cx', '' + 0);
    perimeter.setAttribute('cy', '' + 0);
    perimeter.setAttribute('r', '' + (BASE_DIAMETER / 2));
    guide_line(perimeter);
    xml_parent.appendChild(perimeter);
}

// Generate an SVG circle in the specified XML parent element in the
// direction specified.  x_direction and y_direction should each be
// either 1 or -1.  The resulting circle represents a single mounting
// hole for connecting the plate to the router base.
function dw6184_mounting_hole(xml_parent, x_direction, y_direction) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + (MH_XY_DELTA * x_direction));
    hole.setAttribute('cy',   '' + (MH_XY_DELTA * y_direction));
    hole.setAttribute('r',   '' + (MH_DIAMETER / 2));
    inside_cut(hole);
    xml_parent.appendChild(hole);
}


function dw6184_mounting_hole_countersink(xml_parent, x_direction, y_direction) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + (MH_XY_DELTA * x_direction));
    hole.setAttribute('cy',   '' + (MH_XY_DELTA * y_direction));
    hole.setAttribute('r',   '' + (MH_COUNTERSINK_DIAMETER / 2));
    pocket_cut(hole);
    xml_parent.appendChild(hole);
}

// dw6184_center_hole returns a circle, centered on the spindle,
// representing the clearance hole in the middle of the base plate.
function dw6184_center_hole(xml_parent) {
    var hole = document.createElementNS(svgURI, 'circle');
    hole.setAttribute('cx',   '' + 0);
    hole.setAttribute('cy',   '' + 0);
    hole.setAttribute('r',   '' + (CENTER_HOLE_DIAMETER / 2));
    inside_cut(hole);
    xml_parent.appendChild(hole);
}
