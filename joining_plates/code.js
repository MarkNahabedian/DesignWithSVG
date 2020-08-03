
////////////////////////////////////////////////////////////

var TEST= true;

function fix_float(x) {
  return Math.round(x * 100000) / 100000;
}

function pointEqual(p1, p2) {
  return ( fix_float(p1[0]) == fix_float(p2[0]) &&
           fix_float(p1[1]) == fix_float(p2[1]) );
}


////////////////////////////////////////////////////////////
// These are initialized by loading json files
var extrusions = [];      // Initialized by load_extrusions.
var holes = [];           // Initialized by load_holes.


////////////////////////////////////////////////////////////
// These are set by various "update" functions:
var selected_extrusion;      // element of extrusions.
var selected_hole;           // element of holes.
var grid_width;
var grid_height;

function update_extrusion(elt) {
  selected_extrusion = extrusions[elt.value];
  update_grid_width();
  update_grid_height();
}


function update_hole(elt) {
  selected_hole = holes[elt.value];
  update_geometry();
}


function update_grid_dimension(elt, setter) {
  var val = parseFloat(elt.value);
  if (isNaN(val) || val <= 0) {
    elt.setAttribute('class', 'BadInput');
    return;
  }
  elt.removeAttribute('class');
  setter(val);
  elt.nextElementSibling.textContent = "" +
    val * selected_extrusion.measurement +
    " " + selected_extrusion.units;
  update_geometry();
}

function update_grid_width() {
  var elt = document.getElementById("grid-width");
  update_grid_dimension(elt,
                        function(val) {
                          grid_width = val;
                        });
}

function update_grid_height() {
  var elt = document.getElementById("grid-height");
  update_grid_dimension(elt,
                        function(val) {
                          grid_height = val;
                        });
}


function load_json(path) {
  return fetch(path).then(function(response) {
    return response.text().then(
      function(txt) {
        try {
          var parsed = JSON.parse(txt);
          return Promise.resolve(parsed);
        }
        catch (error) {
          throw (path + ": " + error);
        }
        return true;
      },
      console.log);
  });
}

function update_selection(elt, values) {
  for (var i = 0; i < values.length; i++) {
    var opt = document.createElement('option')
    opt.setAttribute("value", i);
    if (i == 0) {
      opt.setAttribute("selected", "");
    }opt.textContent = values[i].name;
    elt.appendChild(opt);
  }
  return elt;
}

function load_extrusions() {
  load_json("extrusions.json").then(
    function(data) {
      extrusions = data;
      update_extrusion(
        update_selection(document.querySelector(
          "#" + "choose-profile" + " select"), data));
    });
}

function load_holes() {
  load_json("holes.json").then(
    function(data) {
      holes = data
      update_hole(
        update_selection(document.querySelector(
          "#" + "hole-diameter" + " select"), data));
    });
}


function contentLoaded() {
  load_extrusions();
  load_holes();
  geometry = new Geometry();
  setSVGNamespaces();
}


////////////////////////////////////////////////////////////

// Map from pretty unit names as appear in our data file to the units
// used by SVG
var SVG_UNITS = {
  "inch": "in",
  "mm": "mm"
};

var UNIT_CONVERSION = {
  "inch-inch": 1,
  "mm-mm": 1,
  "inch-mm": 25.4,
  "mm-inch": 1 / 25.4
};

function convert(from, to) {
  return UNIT_CONVERSION[from + "-" + to];
}


function modref(arr, index) {
  let l = arr.length;
  return arr[((index % l) + l) % l];
}


function hole(centerX, centerY, scale) {
  circle = document.createElementNS(svgURI, 'circle');
  circle.setAttribute('cx',   '' + centerX);
  circle.setAttribute('cy',   '' + centerY);
  // The SVG document uses selected_extrusion.units for its units.
  // This might not match selected_hole.units.  Convert.
  circle.setAttribute('r',   '' +
                      convert(selected_hole.units,
                              selected_extrusion.units) *
                      (selected_hole.diameter / 2) / scale
                     );
  return circle;
}


function toggle_hole(i, j) {
  geometry.drill_these[i][j] = ! geometry.drill_these[i][j];
  update_geometry();
}


////////////////////////////////////////////////////////////

var geometry;

function update_geometry() {
  geometry.updateSVG(document.getElementById('SVG_ELEMENT'));
  var code_elt = document.getElementById('CODE_ELEMENT');
  while (code_elt.firstChild)
    code_elt.firstChild.remove();
  showSVG(document.getElementById('SVG_ELEMENT'),
          code_elt);
}


class Geometry {
  constructor() {
    this.margin = 0.25;
    this.drill_these = Array(10);
    for (var i = 0; i < 10; i++) {
      this.drill_these[i] = Array(10);
      for(var j = 0; j < 10; j++) {
        this.drill_these[i][j] = false;
      }
    }
  }
    
  svgWidth() {
    return grid_width * selected_extrusion.measurement + 2 * this.margin;
  }
    
  svgHeight() {
    return grid_height * selected_extrusion.measurement + 2 * this.margin;
  }
    
  updateSVG(svg_elt) {
    if (!selected_extrusion)
      return;
    if (!selected_hole)
      return;
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(),
                     SVG_UNITS[selected_extrusion.units]);
    // Clear existing SVG:
    while (svg_elt.firstChild)
      svg_elt.firstChild.remove();
    // Coordinate translation
    var g = document.createElementNS(svgURI, 'g');
    // Establish a coordinate system based on grid units with hole
    // positions having integer coordinates-- independent of selected
    // extrusion measurement.
    {
      let offset = this.margin + selected_extrusion.measurement / 2;
      var scale = selected_extrusion.measurement;
      g.setAttribute('transform',
                     "translate(" + offset + ", " + offset + ")" +
                    " scale(" + scale + ")");
    }
    // Perimeter:
    {
      let groups = make_holes_and_groups(this.drill_these);
      for (let group of groups) {
        let abstract_path = group.path();
        let d = path_to_d(abstract_path, 0.1, 0.1);
        let p = document.createElementNS(svgURI, 'path');
        p.setAttribute("d", d);
        outside_cut(p);
        g.appendChild(p);
      }
      // Test corners
      if (false) {
        for (let group of groups) {
          for (let seg of group.segments) {
            for (let circle of seg.test_corner_points(0.1, 0.1)) {
              g.appendChild(circle);
            }
          }
        }
      }
    }
    // Locate the holes:
    for (var x = 0; x < grid_width; x++) {
      for(var y = 0; y < grid_height; y++) {
        // For convenience, we scaled the local coordinate system so
        // that a unit coordinate matched the width of the selected
        // extrusion type.  This would mess up the size of the hole to
        // be drilled, but hole() adds an absolute units designator to
        // the radius.
        var h = hole(x, y, scale);
        h.setAttribute("onclick", "toggle_hole(" + x + ", " + y + ")");
        if (this.drill_these[x][y]) {
          inside_cut(h);
        } else {
          // guide_line(h);
          h.setAttribute('fill','#0068FF');
          h.setAttribute('stroke', '#0068FF');  // blue
          h.setAttribute('stroke-width', '.01');
          h.setAttribute('opacity', '1.0');
        }
        g.appendChild(h);
      }
    }
    svg_elt.appendChild(g);
  }

};


////////////////////////////////////////////////////////////
// Try strarting with holes instead of segments.

class Hole {
  constructor(holeX, holeY) {
    this.x = holeX;
    this.y = holeY;
    this.group = new Group(this);
  }

  is_at(x, y) {
    return this.x == x && this.y == y;
  }

  // neighbors returns true iff two Holes are next to each other.
  neighbors(other) {
    if (this.x == other.x) {
      return ((this.y == other.y + 1) ||
              (this.y == other.y - 1));
    }
    if (this.y == other.y) {
      return ((this.x == other.x + 1) ||
              (this.x == other.x - 1));
    }
    return false;
  }

  make_segments() {
    let segs = [];
    for (let side of ["N", "E", "S", "W"]) {
      segs.push(new Segment(this, side));
    }
    return segs;
  }

};

class Group {
  constructor(hole) {
    this.holes = [hole];
    this.segments = null;
    this._path = null;
  }

  absorb(other) {
    if (this == other)
      return;
    for (let hole of other.holes) {
      this.holes.push(hole);
      hole.group = this;
    }
  }

  // path returns an abstract path -- a vector consisting of Segment,
  // ConvexCorner and ConcaveCorner.
  path() {
    // this.segments has already been ordered end to end.
    if (this._path != null)
      return this._path;
    let path = [];
    for (let i = 0; i < this.segments.length; i++) {
      let seg = this.segments[i];
      let next = modref(this.segments, i + 1);
      path.push(seg);
      if (seg.convex_corner(next)) {
        path.push(new ConvexCorner(seg, next));
      } else if (seg.concave_corner(next)) {
        path.push(new ConcaveCorner(seg, next));
      } else if(!seg.in_line(next)) {
        throw ["ERROR: segments join but neither in-line nor corner:",
               seg, next];
      }
    }
    this._path = path;
    return this._path;
  }
}

if (TEST) {
  let h1 = new Hole(0, 0);
  let h2 = new Hole(0, 1);
  let h3 = new Hole(1,1);
  console.assert(!h2.neighbors(h2));
  console.assert(h1.neighbors(h2));
  console.assert(h2.neighbors(h1));
  console.assert(h2.neighbors(h3));
  console.assert(h3.neighbors(h2));
  console.assert(!h1.neighbors(h3));
  console.assert(!h3.neighbors(h1));
}

function path_to_d(path, inset, radius) {
  let d = [];
  // Starting point:
  d.push("M", ...path[0].start(inset, radius));
  for (let step of path) {
    let step_d = step.path_step(inset, radius);
    d.push(...step_d);
  }
  return d.join(" ");
}

class Side {
  constructor(name, next, opposite, previous, normal_dx, normal_dy) {
    this.name = name;
    this.next = next;
    this.opposite = opposite;
    this.previous = previous;
  // normal_dx and normal_dy are components of the the direction
  // vector from the Hole to the Segment.  These are unit values
  // indicating direction, but not distance/magnitude..
    this.normal_dx = normal_dx;
    this.normal_dy = normal_dy;
  }

};

SIDES = {
  "N": new Side("N", "E", "S", "W", 0, -1),
  "E": new Side("E", "S", "W", "N", 1, 0),
  "S": new Side("S", "W", "N", "E", 0, 1),
  "W": new Side("W", "N", "E", "S", -1, 0),
};

if (TEST) {
  for (s in SIDES) {
    let side = SIDES[s];
    let opp = SIDES[side.opposite];
    let next = SIDES[side.next];
    let prev = SIDES[side.previous];
    console.assert(side.normal_dx == - opp.normal_dx, s);
    console.assert(side.normal_dy == - opp.normal_dy, s);
    console.assert(side.normal_dx == next.normal_dy, s);
    console.assert(side.normal_dy == - next.normal_dx, s);
    console.assert(side.normal_dx == - prev.normal_dy, s);
    console.assert(side.normal_dy == prev.normal_dx, s);
  }
};

class Segment {
  constructor(hole, side) {
    this.hole = hole;
    this._side = side;
  }

  side() {
    return SIDES[this._side];
  }

  other_hole_location() {
    return [ this.hole.x + this.side().normal_dx,
             this.hole.y + this.side().normal_dy ];
  }

  // For start and end, inset is the amount that the Segment is to be
  // shifted toards the segment's Hole to provide a sort of margin
  // between the edge of the joining plate to be cut out and the edge
  // of the extrusion it is to be mounted to.
  //
  // radius is the amount the straight part of the segment is to be
  // shortened to turn a corner into a circular arc.

  start(inset=0, radius=0) {
    let side = this.side();
    // Midpoint of segment adjusted by inset normal to segment:
    let x = this.hole.x + (0.5 - inset) * side.normal_dx;
    let y = this.hole.y + (0.5 - inset) * side.normal_dy;
    // Now apply inset and radius along length of segment:
    let prev = SIDES[side.previous];
    x += (0.5 - inset - radius) * prev.normal_dx;
    y += (0.5 - inset - radius) * prev.normal_dy;
    return [fix_float(x), fix_float(y)];
  }

  end(inset=0, radius=0) {
    let side = this.side();
    // Midpoint of segment adjusted by inset normal to segment:
    let x = this.hole.x + (0.5 - inset) * side.normal_dx;
    let y = this.hole.y + (0.5 - inset) * side.normal_dy;
    // Now apply inset and radius axial to segment:
    let next = SIDES[side.next];
    x += (0.5 - inset - radius) * next.normal_dx;
    y += (0.5 - inset - radius) * next.normal_dy;
    return [fix_float(x), fix_float(y)];
  }

  opposes(other) {
    let this_side = this.side();
    let other_side = other.side();
    return ( this.hole.is_at(...other.other_hole_location()) &&
             other.hole.is_at(...this.other_hole_location()) &&
             (this_side.normal_dx == - other_side.normal_dx) &&
             (this_side.normal_dy == - other_side.normal_dy) );
  }

  joins(other) {
    return pointEqual(this.end(), other.start());
  }

  // in_line, concave_corner, and convex_corner are only meaningfor
  // for pairs of segments for which joins is true.

  in_line(other) {
    return ( (this._side == other._side) &&
             (this.hole.neighbors(other.hole)) );
  }

  convex_corner(other) {
    if (this.hole != other.hole)
      return false;
    return this._side != other.side().opposite;
  }

  concave_corner(other) {
    return pointEqual(this.other_hole_location(),
                      other.other_hole_location());
  }

  is_corner() { return false; }

  path_step(inset, radius) {
    // We only need to do any drawing from the corner methods.
    return [];
  }

  test_corner_points(inset=0, radius=0) {
    let elts = [];
    function point(p) {
      let circle = document.createElementNS(svgURI, 'circle');
      circle.setAttribute("cx", p[0]);
      circle.setAttribute("cy", p[1]);
      circle.setAttribute("r", 0.1);
      circle.setAttribute("style",
                          "stroke: none; fill: green;");
      elts.push(circle);
    }
    point(this.start(inset, radius));
    point(this.end(inset, radius));
    return elts;
  }

};

class ConvexCorner {
  constructor(previous_segment, next_segment) {
    this.prev = previous_segment;
    this.next = next_segment;
  }

  is_corner() { return true; }

  path_step(inset, radius) {
    let d = [];
    d.push("L", ...this.prev.end(inset, radius));
    d.push("A");
    d.push(radius);             // X radius
    d.push(radius);             // Y radius
    d.push(0);                  // ellipse angle
    d.push(0);                  // large arc flag false
    d.push(1);                  // Sweep direction
    d.push(...this.next.start(inset, radius));
    return d;
  }

};

class ConcaveCorner {
  constructor(previous_segment, next_segment) {
    this.prev = previous_segment;
    this.next = next_segment;
  }

  is_corner() { return true; }

  path_step(inset, radius) {
    let d = [];
    d.push("L", ...this.prev.end(inset, radius));
    d.push("A");
    d.push(radius);             // X radius
    d.push(radius);             // Y radius
    d.push(0);                  // ellipse angle
    d.push(0);                  // large arc flag false
    d.push(0);                  // Sweep direction
    d.push(...this.next.start(inset, radius));
    return d;
  }

};

if (TEST) {
  let h1 = new Hole(1, 1);
  let [h1n, h1e, h1s, h1w] = h1.make_segments();
  console.assert(h1n.other_hole_location(), [1, 0]);
  console.assert(h1e.other_hole_location(), [2, 1]);
  console.assert(h1s.other_hole_location(), [1, 2]);
  console.assert(h1w.other_hole_location(), [0, 1]);
  
  let h2 = new Hole(2, 1);
  let h2_segments = h2.make_segments();
  let [h2n, h2e, h2s, h2w] = h2_segments;
  console.assert(h1e.opposes(h2w));
  console.assert(!h1w.opposes(h2e));
  for (let i = 0; i < h2_segments.length; i++) {
    let s1 = h2_segments[i];
    let s2 = modref(h2_segments, i + 1);
    console.assert(pointEqual(s1.end(), s2.start()), s1, "end", s2, "start");
    console.assert(pointEqual(s1.end(0.1), s2.start(0.1)), s1, s2);
  }
  function test_point(p, expect) {
    console.assert(pointEqual(p, expect), p, expect);
  }
  test_point(h2n.start(),         [1.5, 0.5]);
  test_point(h1e.start(),         [1.5, 0.5]);
  test_point(h2s.end(),           h1e.end());
  test_point(h2n.start(0.1),      [1.6, 0.6]);
  test_point(h1e.start(0.1),      [1.4, 0.6]);
  test_point(h2n.start(0.1, 0.1), [1.7, 0.6]);
  test_point(h2n.end(0.1, 0.1),   [2.3, 0.6]);
  test_point(h1e.start(0.1, 0.1), [1.4, 0.7]);
  test_point(h1e.end(0.1, 0.1),   [1.4, 1.3]);
  let h3 = new Hole(1,2);
  let [h3n, h3e, h3s, h3w] = h3.make_segments();
  console.assert(h1w.joins(h1n));
  console.assert(h1w.convex_corner(h1n));
  console.assert(h1n.joins(h2n));
  console.assert(h1n.in_line(h2n));
  console.assert(h2n.joins(h2e));
  console.assert(h2n.convex_corner(h2e));
  console.assert(h2e.joins(h2s));
  console.assert(h2e.convex_corner(h2s));
  console.assert(h2s.joins(h3e));
  console.assert(h2s.concave_corner(h3e));
  console.assert(h3e.joins(h3s));
  console.assert(h3s.joins(h3w));
  console.assert(h3w.joins(h1w));
  console.assert(h3w.in_line(h1w));
}

// Reorder the Segments so that for two successive Segments the second
// one starts where the first one ends.
function order_segments(segs) {
  let segments = segs.slice();
  let ordered = [];
  let last = segments[0];
  ordered.push(last);
  let any = true;
  while (any) {
    any = false
    for (let i = 0; i < segments.length; i++) {
      let seg = segments[i];
      if (seg == null)
        continue;
      if (last.joins(seg)) {
        ordered.push(seg);
        last = seg;
        segments[i] = null;
        any = true;
      }
    }
  }
  return ordered;
}

function make_holes_and_groups(a) {
  var holes = [];
  for (let x = 0; x < a.length; x++) {
    for(let y = 0; y < a[0].length; y++) {
      if (a[x][y]) {
        holes.push(new Hole(x, y));
      }
    }
  }
  // Group neighboring Holes:
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      if (holes[i].neighbors(holes[j])) {
        holes[i].group.absorb(holes[j].group)
      }
    }
  }
  // Adjacent Holes have now been grouped together.  Collect Groups,
  // Collect bounding Segments.
  //
  // A Segment is part of the perimeter of a joining plate iff there
  // is not a hole on the other side of the segment.
  let groups = [];
  for (let hole of holes) {
    if (hole.group.segments == null) {
      // We've not encountered this group yet.
      let g = hole.group;
      g.segments = []
      groups.push(g);
      function ok_to_keep(seg) {
        // A Segment is not an edge if there's another hole on the
        // other side, or if the other side is outside of the grid.
        let [other_x, other_y] = seg.other_hole_location();
        if (other_x < 0) return true;
        if (other_y < 0) return true;
        if (other_x >= a.length) return true;
        if (other_y >= a[0].length) return true;
        return !a[other_x][other_y];
      }
      for (let gh of g.holes) {
        for (let seg of gh.make_segments()) {
          // Keep the segment if the array reference returns false or
          // undefined.
          if (ok_to_keep(seg)) {
            g.segments.push(seg);
          }
        }
      }
    }
  }
  for (let g of groups) {
    g.segments = order_segments(g.segments);
  }
  GROUPS = groups;
  return groups;
}

var GROUPS;

////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", contentLoaded, false);
