
var MM_PER_INCH = 25.4;
var INCH = "inch";
var MM = "mm";


function center(elt) {
  let bbox = elt.getBBox();
  return [ bbox.x + bbox.width / 2,
           bbox.y + bbox.height / 2 ];
}


function as_fraction(x) {
  let denominator = 1;
  while (true) {
    if (x * denominator == Math.round(x * denominator))
      return [x * denominator, denominator];
    denominator *= 2;
    if (denominator > 64)
      return x;
  }
}


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

  label_text() {
    if (this.units == INCH) {
      let frac = as_fraction(this.size);
      if (frac instanceof Array)
        return frac[0] + "/" + frac[1];
      else
        return "" + this.size;
      
    } else {
      return "" + this.size;
    }
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
    // Clear existing SVG:
    while (svg_elt.firstChild)
      svg_elt.firstChild.remove();
    let part = document.createElementNS(svgURI, 'g');
    // Group translated to allow for border_space:
    part.setAttribute("transform",
                      "translate(" +
                      (this.border_space) +
                      ", " +
                      (this.border_space) +
                      ")")
    svg_elt.appendChild(part);
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
    part.appendChild(outer_edge);
    let inset_extra = document.createElementNS(svgURI, 'g');
    inset_extra.setAttribute("transform",
                             "translate(" + this.extra + ", " + this.extra + ")");
    part.appendChild(inset_extra);
    // Gauge path
    let d = [["M", 0, 0]];
    for (let hk of this.hex_keys) {
      d.push(["L", hk.start_x, hk.inch()]);
      d.push(["H", hk.end_x]);
    }
    d.push(["V", 0]);
    d.push(["H", 0]);
    inside_cut(path(inset_extra, d))
      .setAttribute("transform",
                    "translate(" + 0 + ", " + this.top_text_space + ")");
    // Label text
    let imperial = document.createElementNS(svgURI, 'g');
    let metric = document.createElementNS(svgURI, 'g');
    imperial.setAttribute("class", "imperial");
    metric.setAttribute("class", "metric");
    metric.setAttribute("transform",
                        "translate(0, " + (this.top_text_space / 2) + ")");
    imperial.setAttribute("transform",
                          "translate(0, " +
                          (this.top_text_space + this.gauge_height + this.bottom_text_space / 2) +
                          ")");
    for (let hk of this.hex_keys) {
      let txt;
      if (hk.units === INCH) {
        txt = renderText(imperial, FONT, hk.label_text(), KERNING);
      } else {
        txt = renderText(metric, FONT, hk.label_text(), KERNING);
      }
      on_line_cut(txt);
      txt.setAttribute(
        "transform",
        "translate(" + ((hk.start_x  + hk.end_x) / 2) + ", " + 0 + ")" +
          "scale(0.005)" +
          "rotate(270)"
      );
    }
    inset_extra.appendChild(imperial);
    inset_extra.appendChild(metric);
  }
};


var GEOMETRY;

var FONT = null;
var KERNING = null

// load_font_data calls continuation with the font and kerning data
// once they are loaded.
function load_font_data(font_name, continuation) {
  let base_uri = "../hershey/fonts/";
  // let base_uri = "https://raw.githubusercontent.com/MarkNahabedian/DesignWithSVG/master/hershey/fonts/";
  let font = fetch(base_uri + font_name + ".json").then(
    function (response) {
      if (!response.ok) {
        console.log(response.statusText);
        return;
      }
      return response.text().then(
        function (txt) {
          return JSON.parse(txt);
        },
        console.log);
    },
    console.log
  );
  let kerning = fetch(base_uri + font_name + ".kerning").then(
    function (response) {
      if (!response.ok) {
        console.log(response.statusText);
        return;
      }
      return response.text().then(
        function (txt) {
          return parseKerning(txt);
        },
        console.log);
    },
    console.log
  );
  Promise.all([font, kerning]).then(
    function(values) {
      continuation(values[0], values[1]);
    },
    console.log);
}

function contentLoaded() {
  setSVGNamespaces();
  GEOMETRY = new Geometry();
  load_font_data(
    "Sans_1-stroke",
    function(font, kerning) {
      FONT = font;
      KERNING = kerning;
      GEOMETRY.updateSVG(document.getElementById('SVG_ELEMENT'));
      showSVG(document.getElementById('SVG_ELEMENT'),
              document.getElementById('CODE_ELEMENT'));
    });
}


document.addEventListener("DOMContentLoaded", contentLoaded, false);

