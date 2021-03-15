//   -*- js-indent-level: 2; -*-

// Extra spacs between the bounding rectangle of a part and the edges
// of the SVG element.
var SVG_MARGIN = 0.5;

var GUIDE_GRID_SPACING = 0.5;

var ROUNDED_CORNER_RADIUS = 0.25;

var BASE_PLATE_THICKNESS = 0.25;

// Diameter of a 1/4 inch fender washer
var WASHER_DIAMETER = 1.0;

var STAR_KNOB_DIAMETER = 1.5;

// Free fit clearance for 1/4 - 20 machine screw.
var SCREW_CLEARANCE = 0.2660;

var MAX_STOCK_THICKNESS = 2;

// We add a protrusion at the back edge of the base plate which can be
// used as a stop for making stopped grooves.  A block can be clamped
// to the stock such that this protrusion will hit the block at the
// stopping point.
var STOP_TAB_WIDTH_A = 1;
var STOP_TAB_DEPTH_B = 1;

var MORTISE_CENTERING_PIVOT_HOLE_DIAMETER = 0.25;
var MORTISE_CENTERING_PIVOT_DISTANCE = 3.5;

// There will be a second fence that can be set so that the position
// of the main fence can be set relative to it.
// We need to ensure that the knobs of the two fences don't interfere
// with one another.

// COORDINATE AXES:
// We define two axes so we can talk about orienting aspects of our
// design.
// The A axis runs parallel to the face of the fence.
// The B axis runs perpendicular to it.
// We append the relevant axis name to each dimension to emphasize
// the axis that dimension runs parallel to.
// The 0 position of each axis is at the center of the router spindle.

class SubBaseGeometry {
  constructor() {
    // Dimensions are in inches.
    // Dimensions of metal base expressed as distance from
    // spindle center.  We take the larger of the dw6182 and
    // dw6184 dimensions.
    var base_A = Math.max(BASE_DIAMETER / 2, BASE_TOTAL_WIDTH / 2);
    var base_B = Math.max(BASE_DIAMETER / 2, BASE_TOTAL_DEPTH / 2);
    this.back_edge_B = - base_B - 1;
    this.front_edge_B = base_B + 2;
    this.corner_radius = 0.5;
    this.slot_width_A = SCREW_CLEARANCE;
    this.beyond_slot_A = 1;
    this.adjuster_clearance = Math.max(WASHER_DIAMETER, STAR_KNOB_DIAMETER) / 2;
    console.assert(this.beyond_slot_A > this.adjuster_clearance,
                   'beyond_slot must be greater than adjuster_clearance');
    this.half_width_A = (base_A + 2 * this.adjuster_clearance +
                         this.slot_width_A + this.beyond_slot_A +
                         // extra width
                         BASE_PLATE_THICKNESS);
    this.slot_center_A = this.half_width_A - this.beyond_slot_A -
      this.slot_width_A / 2;
    // Our coordinate system is centered on the router spindle.
    // These offsets translate from spindle centric coordinates to
    // SVG coordinates:
    this.x_translate_A = SVG_MARGIN + this.half_width_A;
    this.y_translate_B = SVG_MARGIN + STOP_TAB_DEPTH_B + Math.abs(this.back_edge_B);
  }
  
  svgWidth() {
    // Return the value for the width attribute of the SVG element.
    return 2 * (this.half_width_A + SVG_MARGIN);
  }
  
  svgHeight() {
    // Return the value for the height attribute of the SVG element.
    return Math.abs(this.front_edge_B - this.back_edge_B) + STOP_TAB_DEPTH_B + 2 * SVG_MARGIN;
  }
  
  updateSVG(svg_elt) {
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(), 'in');
    var g = document.getElementById("subbase");
    g.setAttribute('transform', 'translate(' +
                   (this.x_translate_A) + ', ' +
                   (this.y_translate_B) + ')');
    var left_A = - this.half_width_A;
    var right_A = this.half_width_A;
    var front_B = this.front_edge_B;
    var back_B = this.back_edge_B;
    // Perimeter:
    var perimeter = path(document.getElementById("perimeter"), [
      ['M', left_A + ROUNDED_CORNER_RADIUS, back_B],

      // Stop tab
      ['H', - STOP_TAB_WIDTH_A / 2 - ROUNDED_CORNER_RADIUS],
      ['a', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, false,
       ROUNDED_CORNER_RADIUS, - ROUNDED_CORNER_RADIUS],
      ['v', - STOP_TAB_DEPTH_B + 2 * ROUNDED_CORNER_RADIUS],
      ['a', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       ROUNDED_CORNER_RADIUS, - ROUNDED_CORNER_RADIUS
      ],
      ['H', STOP_TAB_WIDTH_A / 2 - ROUNDED_CORNER_RADIUS],
      ['a', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS
      ],       
      ['V', back_B - ROUNDED_CORNER_RADIUS],
      ['a', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, false,
       ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS
      ],
      // End stop tab

      ['H', right_A - ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       right_A, back_B + ROUNDED_CORNER_RADIUS
      ],
      ['V', front_B - ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       right_A - ROUNDED_CORNER_RADIUS, front_B
      ],
      ['H', left_A + ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       left_A, front_B - ROUNDED_CORNER_RADIUS
      ],
      ['V', this.back_edge_B + ROUNDED_CORNER_RADIUS ],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       left_A + ROUNDED_CORNER_RADIUS, back_B
      ]            
    ]);
    outside_cut(perimeter);
    // Center hole
    var center_hole = document.querySelector("#center_hole circle");
    inside_cut(hole([0, 0], BASE_PLATE_HOLE_DIAMETER, center_hole));
    // dw6184 router base accomodations:
    var bg4 = document.getElementById("dw6184");
    dw6184_base_perimeter(bg4);
    mounting_holes(bg4, dw6184_mounting_hole_center,
                  "Mounting hole for dw6184 fixed base.");
    // dw6182 router base accomodations:
    var bg2 = document.getElementById("dw6182");
    dw6182_base_extent(bg2);
    mounting_holes(bg2, dw6182_mounting_hole_center,
                  "Mounting hole for dw6182 plunge base.");
    // Slots:
    var geo = this;
    var draw_slot = function(direction) {
      var sg = document.createElementNS(svgURI, 'g');
      var g = document.getElementById("slots");
      g.appendChild(sg);
      var slot_outside_edge_A = geo.slot_center_A + geo.slot_width_A;
      var slot = path(sg, [
        ['M',
         direction * slot_outside_edge_A,
         geo.back_edge_B + geo.adjuster_clearance - SCREW_CLEARANCE / 2],
        ['V', geo.front_edge_B - geo.adjuster_clearance],
        ['h', - direction * geo.slot_width_A],
        ['V', geo.back_edge_B + geo.adjuster_clearance +  SCREW_CLEARANCE / 2],
        ['h', direction * geo.slot_width_A]
      ]);
      tooltip(slot, "Fence adjustment slot.");
      inside_cut(slot);
      guide_line(path(sg, [
        ['M', direction * (slot_outside_edge_A + geo.adjuster_clearance),
         geo.back_edge_B],
        ['V', geo.front_edge_B]]));
      guide_line(path(sg, [
        ['M', direction * (slot_outside_edge_A -
                           geo.slot_width_A -
                           geo.adjuster_clearance),
         geo.back_edge_B],
        ['V', geo.front_edge_B]]));
    };
    draw_slot(-1);
    draw_slot(1);
    {
      // Guide line text showing pocket depth
      var p1 = dw6184_mounting_hole_center(-1, -1);
      var p2 = dw6184_mounting_hole_center(1, -1);
      var txt = document.getElementById("pocket_hole_instructions");
      txt.appendChild(document.createTextNode(
        'pocket depth ' + MH_COUNTERSINK_DEPTH + ' inch'));
      guide_line(txt);
      txt.removeAttribute('stroke-width');
      txt.setAttribute('x', '0');
      txt.setAttribute('y', '0');
      txt.setAttribute('font-family', 'sans-serif');
      txt.setAttribute('fill', txt.getAttribute('stroke'));
      var scale = 'scale(' +
          (0.8 * (p2[0] - p1[0]) /
           txt.getBBox().width) + ')';
      txt.setAttribute('transform', scale);
      var trans = 'translate(' + 
          (- txt.getBBox().width / 2) + ' ' + p1[1] + ')';
      txt.setAttribute('transform', scale + trans);
    }
    // Pivot holes for centering a mortise
    var centering_holes = document.getElementById("centering_holes");
    centering_holes.appendChild(inside_cut(hole(
      [MORTISE_CENTERING_PIVOT_DISTANCE, 0],
      MORTISE_CENTERING_PIVOT_HOLE_DIAMETER)));
    centering_holes.appendChild(inside_cut(hole(
      [- MORTISE_CENTERING_PIVOT_DISTANCE, 0],
      MORTISE_CENTERING_PIVOT_HOLE_DIAMETER)));
    // Add some more guide lines just to get a sense of measurement.
    var spacing = GUIDE_GRID_SPACING;
    var g1 = document.getElementById("guide_lines");
    for (var y = 0; y > this.back_edge_B; y -= spacing) {
      tooltip(
        guide_line(path(g1, [
          ['M', - this.half_width_A, y],
          ['H', this.half_width_A]
        ])),
        "Horizontal lines spaced " + spacing + " inch apart.");
    }
    for (var y = spacing; y < this.front_edge_B; y += spacing) {
      tooltip(
        guide_line(path(g1, [
          ['M', - this.half_width_A, y],
          ['H', this.half_width_A]
        ])),
        "Horizontal lines spaced " + spacing + " inch apart.");
    }
    // Vertical center line
    tooltip(guide_line(path(g1, [
      ['M', 0, back_B - STOP_TAB_DEPTH_B],
      ['V', front_B]
    ])), "center liine");
    for (var x = spacing; x < this.half_width_A; x += spacing) {
      var txt = "Vertical tick marks, spaced " + spacing + " apart.";
      tooltip(
        guide_line(path(g1, [
          ['M', x, - spacing / 2],
          ['v', spacing]
        ])), txt);
      tooltip(
        guide_line(path(g1, [
          ['M', - x, - spacing / 2],
          ['v', spacing]
        ])), txt);
    }
    g.appendChild(g1);
  }
};


function hole(center, diameter, circle) {
  if (!circle) {
    circle = document.createElementNS(svgURI, 'circle');
  }
  circle.setAttribute('cx',   '' + center[0]);
  circle.setAttribute('cy',   '' + center[1]);
  circle.setAttribute('r',   '' + (diameter / 2));
  return circle;
}

// mounting_hole creates an SVG circle element for a hole centered at
// center (a two element array of x, y) with the specified diameter.
// The hole is returned.
function mounting_hole(xml_parent, center, tooltip_text) {
  xml_parent.appendChild(
    pocket_cut(hole(center, MH_COUNTERSINK_DIAMETER)));
  xml_parent.appendChild(
    tooltip(inside_cut(hole(center, MH_DIAMETER)), tooltip_text));
}

function mounting_holes(xml_parent, center_function, tooltip_text) {
  mounting_hole(xml_parent, center_function(-1, -1), tooltip_text);
  mounting_hole(xml_parent, center_function(-1, 1)), tooltip_text;
  mounting_hole(xml_parent, center_function(1, 1), tooltip_text);
  mounting_hole(xml_parent, center_function(1, -1), tooltip_text);
}

function draw_grid(group, spacing, x1, x2, y1, y2) {
  var vrules = document.createElementNS(svgURI, 'g');
  group.appendChild(vrules);
  for (var x = 0; x < x2; x += spacing) {
    guide_line(path(vrules, [
      ['M', x, y1],
      ['V', y2]
    ]));
  }
  for (var x = - spacing; x > x1; x -= spacing) {
    guide_line(path(vrules, [
      ['M', x, y1],
      ['V', y2]
    ]));
  }
  var hrules = document.createElementNS(svgURI, 'g');
  group.appendChild(hrules);
  for (var y = 0; y <= y2; y += spacing) {
    guide_line(path(hrules, [
      ['M', x1, y],
      ['H', x2]
    ]));
  }
  for (var y = - spacing; y >= y1; y -= spacing) {
    guide_line(path(hrules, [
      ['M', x1, y],
      ['H', x2]
    ]));
  }
}


class FenceGeometry {
  constructor(subbaseGeometry) {
    // Dimensions are in inches.
    this.sbg = subbaseGeometry
    this.cutter_clearance_radius = 0.5;
    this.fence_height_B = 1 + this.cutter_clearance_radius;
  }

  svgWidth() {
    // Return the value for the width attribute of the SVG element.
    return this.sbg.svgWidth();
  }
  
  svgHeight() {
    // Return the value for the height attribute of the SVG element.
    return this.fence_height_B + 2 * SVG_MARGIN;
  }

  updateSVG(svg_elt) {
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(), 'in');
    var g = document.createElementNS(svgURI, 'g');
    g.setAttribute('transform', 'translate(' +
                   (this.sbg.x_translate_A) + ', ' +
                   SVG_MARGIN + ')');
    var left_A = - this.sbg.half_width_A;
    var right_A = this.sbg.half_width_A;
    var top_B = 0;
    var bottom_B = this.fence_height_B;
    var perimeter = path(g, [
      ['M', left_A + ROUNDED_CORNER_RADIUS, top_B],
      ['H', - this.cutter_clearance_radius],
      // Cutter cutout
      ['A', this.cutter_clearance_radius, this.cutter_clearance_radius,
       0.0, false, false,
       this.cutter_clearance_radius, 0],
      ['H', right_A - ROUNDED_CORNER_RADIUS],
      // corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       right_A, top_B + ROUNDED_CORNER_RADIUS],
      ['V', bottom_B - ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       right_A - ROUNDED_CORNER_RADIUS, bottom_B],
      ['H', left_A + ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       - this.sbg.half_width_A, this.fence_height_B - ROUNDED_CORNER_RADIUS],
      ['V', ROUNDED_CORNER_RADIUS],
      // Corner
      ['A', ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS,
       0.0, false, true,
       - this.sbg.half_width_A + ROUNDED_CORNER_RADIUS, 0]
    ]);
    outside_cut(perimeter);
    g.appendChild(perimeter);
    svg_elt.appendChild(g);
    // Holes for the positioning hardware
    var geo = this;
    var fence_hole = function(x) {
      var y = geo.fence_height_B / 2;
      var hole = document.createElementNS(svgURI, 'circle');
      hole.setAttribute('cx',   '' + x);
      hole.setAttribute('cy',   '' + y);
      hole.setAttribute('r',   '' + (SCREW_CLEARANCE / 2));
      inside_cut(hole);
      g.appendChild(hole);
      var clearance = document.createElementNS(svgURI, 'circle');
      clearance.setAttribute('cx',   '' + x);
      clearance.setAttribute('cy',   '' + y);
      clearance.setAttribute('r',   '' + geo.sbg.adjuster_clearance);
      guide_line(clearance);
      g.appendChild(clearance);
    };
    fence_hole(this.sbg.slot_center_A);
    fence_hole(- this.sbg.slot_center_A);
    for (var y = GUIDE_GRID_SPACING; y < this.fence_height_B; y += GUIDE_GRID_SPACING) {
      g.appendChild(
        tooltip(
          guide_line(
            svg_line(- this.sbg.half_width_A, y,
                     this.sbg.half_width_A, y)
            /*
              path(g, [
              ['M', - this.sbg.half_width_A, y],
              ['H', this.sbg.half_width_A]
              ])
            */
          ),
          "Guideline grid, " + GUIDE_GRID_SPACING + " inch spacing."));
    }
    // Pivot holes for centering a mortise
    g.appendChild(inside_cut(hole(
      [MORTISE_CENTERING_PIVOT_DISTANCE,
       geo.fence_height_B / 2],
      MORTISE_CENTERING_PIVOT_HOLE_DIAMETER)));
    g.appendChild(inside_cut(hole(
      [- MORTISE_CENTERING_PIVOT_DISTANCE,
       geo.fence_height_B / 2],
      MORTISE_CENTERING_PIVOT_HOLE_DIAMETER)));
  }
};


function tooltip(element, text) {
  var tt = document.createElementNS(svgURI, 'title');
  tt.textContent = text;
  element.appendChild(tt);
  return element;
}


function show_dimensions(parent, subbase, fence) {
  var dimension = function(text) {
    var t = document.createElement('p');
    var t1 = document.createTextNode(text);
    t.appendChild(t1);
    parent.appendChild(t);
  };
  dimension('Subbase width: ' + (2 * subbase.half_width_A));
  dimension('Subbase height: ' + (subbase.front_edge_B - subbase.back_edge_B));
  var fence_adjustment_hole_offset = fence.fence_height_B / 2;
  dimension('Fence max back position: ' + (
    subbase.back_edge_B + subbase.adjuster_clearance + fence_adjustment_hole_offset));
  dimension('Fence max front position: ' + (
    subbase.front_edge_B - subbase.adjuster_clearance -fence_adjustment_hole_offset));
}


function contentLoaded() {
  setSVGNamespaces();
  var subbase = new SubBaseGeometry();
  subbase.updateSVG(document.getElementById('SUBBASE_SVG_ELEMENT'));
  showSVG(document.getElementById('SUBBASE_SVG_ELEMENT'),
          document.getElementById('SUBBASE_CODE_ELEMENT'));
  var fence = new FenceGeometry(subbase);
  fence.updateSVG(document.getElementById('FENCE_SVG_ELEMENT'));
  showSVG(document.getElementById('FENCE_SVG_ELEMENT'),
          document.getElementById('FENCE_CODE_ELEMENT'));
}

document.addEventListener("DOMContentLoaded", contentLoaded, false);

