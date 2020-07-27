
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
document.addEventListener("DOMContentLoaded", contentLoaded, false);
