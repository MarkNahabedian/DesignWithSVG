

// These are initialized by loading json files
var extrusions = [];      // Initialized by load_extrusions.
var holes = [];           // Initialized by load_holes.

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


function to_inches(val) {
  switch (selected_extrusion.units) {
    case "inch":
      return val;
      break;
    case "mm":
      return val / 25.4;
      break;
    default:
      return val;
  }
}


function hole(centerX, centerY, diameter) {
  circle = document.createElementNS(svgURI, 'circle');
  circle.setAttribute('cx',   '' + centerX);
  circle.setAttribute('cy',   '' + centerY);
  circle.setAttribute('r',   '' + (diameter / 2));
  return circle;
}


function toggle_hole(i, j) {
  console.log("toggle_hole", i, j);
  geometry.drill_these[i][j] = ! geometry.drill_these[i][j];
  update_geometry();
}


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
    this.drill_these = Array(10);
    for (var i = 0; i < 10; i++) {
      this.drill_these[i] = Array(10);
      for(var j = 0; j < 10; j++) {
        this.drill_these[i][j] = false;
      }
    }
  }
    
  svgWidth() {
    return to_inches(grid_width * selected_extrusion.measurement) + 0.5;
  }
    
  svgHeight() {
    return to_inches(grid_height * selected_extrusion.measurement) + 0.5;
  }
    
  updateSVG(svg_elt) {
    if (!selected_extrusion)
      return;
    if (!selected_hole)
      return;
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(), "in");
    // Clear existing SVG:
    while (svg_elt.firstChild)
      svg_elt.firstChild.remove();
    // DRAW iNTO svg_elt HERE.
    // Coordinate translation
    var g = document.createElementNS(svgURI, 'g');
    g.setAttribute('transform', 'translate(0.5, 0.5)');


    // Locate the holes:
    for (var i = 0; i < grid_width; i++) {
      var x = (0.5 + i) * selected_extrusion.measurement;
      for(var j = 0; j < grid_height; j++) {
        var y = (0.5 + j) * selected_extrusion.measurement;
        var h = hole(x, y, selected_hole.diameter);
        h.setAttribute("onclick", "toggle_hole(" + i + ", " + j + ")");
        if (this.drill_these[i][j]) {
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

