

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
  console.log("contentLoaded");
  load_extrusions();
  load_holes();
}


function update_geometry() {
  // geometry.updateSVG(document.getElementById('SVG_ELEMENT'));
  // var code_elt = document.getElementById('CODE_ELEMENT');
  // while (code_elt.firstChild)
  //   code_elt.firstChild.remove();
  // showSVG(document.getElementById('SVG_ELEMENT'),
  //         code_elt);
}


class Geometry {
  constructor(/* application specific parameters */) {
    // SET UP DESIGN PARAMETERS, ETC.
  }

    
  svgWidth() {
    return plate_diameter * 1.1;
  }

    
  svgHeight() {
    return plate_diameter * 1.1;
  }

    
  updateSVG(svg_elt) {
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(),
                     UNITS_CHOICES[selected_units]['svg']);
    // Clear existing SVG:
    while (svg_elt.firstChild)
      svg_elt.firstChild.remove();
    // DRAW INTO svg_elt HERE.
    // Coordinate translation
    var g = document.createElementNS(svgURI, 'g');
    if (! geometry.svgWidth())
      return;
    g.setAttribute('transform', 'translate(' +
                   (this.svgWidth() / 2) + ', ' +
                   (this.svgHeight() / 2) + ')');



    svg_elt.appendChild(g);
  }

};

