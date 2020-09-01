
var MM_PER_INCH = 25.4;
var INCH = "inch";
var MM = "mm";


class Measurement {
  constructor(inscribed_diameter, units) {
    this.size = inscribed_diameter;
    this.units = units;
  }

  inch() {
    if (this.units == INCH)
      return this.size;
    else
      return this.size / MM_PER_INCH;
  }

  mm() {
    if (this.units == INCH)
      return this.size * MM_PER_INCH;
    else
      return this.size;
  }

  side_length() {
/*
    return new Measurement(Math.cos((30 / 360) * 2 * Math.PI) / (this.size / 2),
                           this.units);
*/
    return new Measurement(this.size, this.units);
  }
};

var CUTTER_SIZE = new Measurement(1/8, INCH);

var HEX_KEY_SIZES = [
  new Measurement(1/16, INCH),
  new Measurement(5/64, INCH),
  new Measurement(3/32, INCH),
  new Measurement(2.5, MM),
  new Measurement(7/64, INCH),
  new Measurement(3, MM),
  new Measurement(1/8, INCH),
  new Measurement(9/64, INCH),
  new Measurement(9/32, INCH),
  new Measurement(4, MM),
  new Measurement(3/16, INCH),
  new Measurement(5, MM),
  new Measurement(7/32, INCH),
  new Measurement(6, MM),
  new Measurement(1/4, INCH),
  new Measurement(5/16, INCH),
  new Measurement(8, MM),
  new Measurement(3/8, INCH),
  new Measurement(10, MM),
  new Measurement(12, MM),
  new Measurement(14, MM),
  new Measurement(17, MM),
  new Measurement(19, MM)
];


class Geometry {
  constructor() {
    // Ignore hex key sizes that are too small for the specified cutter.
    this.hex_keys = HEX_KEY_SIZES.filter(
      x => x.mm() >= CUTTER_SIZE.mm()
    );
    // Sort in Descending order by size:
    this.hex_keys = this.hex_keys.sort((a, b) => b.mm() - a.mm());
    // Assign a start_x and an end_x to each.
    // All graphics measurements are in inches.
    let x = 0;
    let last_y = 0;     // this.hex_keys[0].inch();
    for (let hk of this.hex_keys) {
      hk.start_x = x + Math.abs(last_y - hk.inch()) / Math.tan(Math.PI / 3);
      hk.end_x = hk.start_x + hk.side_length().inch();
      x = hk.end_x;
      last_y = hk.inch();
    }
    this.gauge_width = x;
    this.gauge_height = this.hex_keys[0].inch();    
    this.top_text_space = 0.5;
    this.bottom_text_space = 0.5;
    // this.extra is within the part.
    this.extra = 0.25;
   // this.border_space is outside of the part.
    this.border_space = 0.2;
  }

  svgWidth() {
    // Allow a half inch margin at each end.
    return this.gauge_width + 2 * (this.extra + this.border_space);
  }
    
  svgHeight() {
    // Allow 1 inch above and below for labeling measurements.
    return this.gauge_height + this.top_text_space + this.bottom_text_space +
      2 * (this.extra + this.border_space);
  }
    
  updateSVG(svg_elt) {
    setupSVGViewport(svg_elt, 0, 0, this.svgWidth(), this.svgHeight(), 'in');
    let g = document.createElementNS(svgURI, 'g');
    // Group translated to allow for border_space:
    g.setAttribute("transform",
                   "translate(" +
                   (this.border_space) +
                   ", " +
                   (this.border_space) +
                   ")")
    svg_elt.appendChild(g);
    // Outside edge
    let outer_edge = document.createElementNS(svgURI, 'rect');
    outer_edge.setAttribute("x", 0);
    outer_edge.setAttribute("y", 0);
    outer_edge.setAttribute("width", 2 * this.extra + this.gauge_width);
    outer_edge.setAttribute("height", 2 * this.extra + this.gauge_height +
                           this.top_text_space + this.bottom_text_space);
    outer_edge.setAttribute("rx", this.border_space);
    outer_edge.setAttribute("ry", this.border_space);
    outside_cut(outer_edge);
    g.appendChild(outer_edge);
    // Gauge path
    let d = [["M", 0, 0]];
    for (let hk of this.hex_keys) {
      d.push(["L", hk.start_x, hk.inch()]);
      d.push(["H", hk.end_x]);
    }
    d.push(["V", 0]);
    d.push(["H", 0]);
    inside_cut(path(g, d))
      .setAttribute("transform",
                    "translate(" +
                    this.extra + ", " +
                    (this.extra + this.top_text_space)  + ")");
  }

};


function contentLoaded() {
  setSVGNamespaces();
  let geometry = new Geometry();
  geometry.updateSVG(document.getElementById('SVG_ELEMENT'));
  showSVG(document.getElementById('SVG_ELEMENT'),
          document.getElementById('CODE_ELEMENT'));
}


document.addEventListener("DOMContentLoaded", contentLoaded, false);

