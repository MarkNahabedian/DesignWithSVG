// Parameters and layout for DeWalt DW6182 plunge base router sub-base
// mounting.

// Parameters and layout assume an origin point that is at the center
// of the router spindle.

// All dimensions are in inches.

var EXPORTED_SYMBOLS = [
    'BASE_TOTAL_WIDTH',
    'BASE_TOTAL_DEPTH',
    'dw6182_base_extent',
    'dw6182_mounting_hole_center'
];


var BASE_TOTAL_WIDTH = 5.7875;
var BASE_TOTAL_DEPTH = 4.42;
var BASE_END_RADIUS = 3;
var BASE_ARC_HEIGHT = BASE_END_RADIUS - Math.sqrt(
    BASE_END_RADIUS * BASE_END_RADIUS -
        (BASE_TOTAL_DEPTH / 2) * (BASE_TOTAL_DEPTH / 2));

var CENTER_HOLE_DIAMETER = 1.1975;


//Mounting holes for attaching the sub-base plate to the base:
var MH_LONG_DISTANCE = 3.11024;        // 79 mm
var MH_SHORT_DISTANCE = 2.59843;       // 66 mm
var MH_DIAMETER = 0.1770;    // Loose clearance for #8-36 machine screw


// dw6182_base_extent returns a rectangle that bounds the outer edge
// of the metal DW6182 router base.
function dw6182_base_extent(xml_parent) {
    var dx = BASE_TOTAL_WIDTH / 2 - BASE_ARC_HEIGHT;
    var dy = BASE_TOTAL_DEPTH / 2;
    var bounds = path(xml_parent, [
        ['M', -dx, -dy],
        ['H', dx],
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        ['A',
         BASE_END_RADIUS, BASE_END_RADIUS,
         0, false, true,
         dx, dy],
        ['H', -dx],
        ['A',
         BASE_END_RADIUS, BASE_END_RADIUS,
         0, false, true,
         -dx, -dy]
    ]);
    guide_line(bounds);
    xml_parent.appendChild(bounds);
}


// dw6182_mounting_hole_center returns [x. y] of the center of the
// specified mounting hole.  x_direction and y_direction should each be
// either 1 or -1.
function dw6182_mounting_hole_center(x_direction, y_direction) {
    return [ (x_direction * MH_LONG_DISTANCE / 2),
             (y_direction * MH_SHORT_DISTANCE / 2) ];
}

