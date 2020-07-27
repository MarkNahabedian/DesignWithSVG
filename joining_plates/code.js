
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

var PATH_SEGMENTS;

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
      let path_segments = (simplify_segments(
        make_segments(this.drill_these)));
      PATH_SEGMENTS = path_segments;
      if (path_segments.length > 0) {
        let d = segments_to_path(path_segments, 0.1);
        var p = document.createElementNS(svgURI, 'path');
        p.setAttribute("d", d);
        outside_cut(p);
        g.appendChild(p);
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

// Segment helps us identify the path surrounding the holes to be drilled.
class Segment {
  constructor(x1, y1, x2, y2, inward) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.inward = inward;
  }

  horizontal() {
    return this.y1 == this.y2;
  }

  vertical() {
    return this.x1 == this.x2;
  }

  joins(other) {
    return this.x2 == other.x1 && this.y2 == other.y1;
  }

  opposes(other) {
    return this.joins(other) && other.joins(this);
  }
  
  path(inset) {
    var p = [];
    if (this.horizontal()) {
      p.push(this.x1 + inset * Math.sign(this.x2 - this.x1));
      p.push(this.y1 + inset * this.inward);      
      p.push(this.x2 + inset * Math.sign(this.x1 - this.x2));
      p.push(this.y2 + inset * this.inward);
    } else if (this.vertical()) {
      p.push(this.x1 + inset * this.inward);      
      p.push(this.y1 + inset * Math.sign(this.y2 - this.y1));
      p.push(this.x2 + inset * this.inward);
      p.push(this.y2 + inset * Math.sign(this.y1 - this.y2));
    }
    return p;
  }

};


function make_segments(a) {
  var result = [];
  for (let x = 0; x < a.length; x++) {
    for(let y = 0; y < a[0].length; y++) {
      if (a[x][y]) {
        let x1 = x - 0.5;
        let y1 = y - 0.5;
        let x2 = x + 0.5;
        let y2 = y + 0.5;
        let points = [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2]
        ];
        for (let i = 0; i < points.length; i++) {
          let p1 = points[i];
          let p2 = points[(i + 1) % points.length];
          let seg = new Segment(p1[0], p1[1], p2[0], p2[1],
                                (p1[1] - p2[1]) +
                                (p2[0] - p1[0]));
          result.push(seg);
        }
      }
    }
  }
  return result;
};

function simplify_segments(segments) {
  var unopposed = [];
  // Remove segments that oppose each other:
  while (segments.length > 0) {
    var seg = segments.pop();
    for (s of segments) {
      if (seg.opposes(s)) {
        segments = segments.filter(function (s1) { return s != s1; })
        seg = null;
        break;
      }
    }
    if (seg != null) {
      unopposed.push(seg);
    }
  }
  // Now order unopposed segments end to end.
  if (unopposed.length == 0)
    return unopposed;
  var path = [];
  var last = unopposed.shift();
  path.push(last);
  while (unopposed.length > 0) {
    var remaining = [];
    while (unopposed.length > 0) {
      var seg = unopposed.shift();
      if (last.joins(seg)) {
        path.push(seg);
        last = seg;
      } else {
        remaining.push(seg);
      }
    }
    unopposed = remaining;
  }
  return path;
}

function segments_to_path(segments, inset) {
  var p = ["M"];
  for (let seg of segments) {
    for (let step of seg.path(inset)) {
      p.push(step);
    }
  }
  p.push("z");
  return p.join(" ");
}


////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", contentLoaded, false);
