
// These are set by various "update" functions:
var selected_units;
var plate_diameter;
var center_hub_diameter;
var dividing_ring_data = [];
var index_hole_diameter;


var UNITS_CHOICES = {
    'IMPERIAL': {
                  'pretty': 'inches',
                  'svg': 'in',
                  'round': 5
                },
    "METRIC":   {
                  'pretty': 'centimeters',
                  'svg': 'cm',
                  'round': 3
                }
};


function fround(f) {
  return f.toFixed(UNITS_CHOICES[selected_units]['round']);
}


function update_units() {
  console.log('update_units');
  var buttons = document.querySelectorAll('input[type="radio"],[name="choose-units"]');
  for (var i = 0; i < buttons.length; i++) {
    var b = buttons[i];
    if (b.checked) {
      var choice = b.value;
      selected_units = choice;
      console.log('update_units ' + choice);
      var spans = document.querySelectorAll('span.fill-in-units');
      for (var i = 0; i < spans.length; i++) {
        spans[i].textContent = UNITS_CHOICES[choice]['pretty'];
      }
      break;
    }
  }
  update_dividing_rings();
  update_geometry();
}


function update_plate_diameter(elt) {
  var val = parseFloat(elt.value);
  if (isNaN(val) || val <= 0) {
    elt.setAttribute('class', 'BadInput');
    return;
  }
  elt.removeAttribute('class');  
  plate_diameter = val;
  update_geometry();
}


function update_center_hub_diameter(elt) {
  var val = parseFloat(elt.value);
  if (isNaN(val) || val <= 0) {
    elt.setAttribute('class', 'BadInput');
    return;
  }
  elt.removeAttribute('class');  
  center_hub_diameter = val;
  update_geometry();
}


function update_index_hole_diameter(elt) {
  var val = parseFloat(elt.value);
  // We allow 0 here to mark with a caret or arrow rather than a hole.
  if (isNaN(val) || val < 0) {
    elt.setAttribute('class', 'BadInput');
    return;
  }
  elt.removeAttribute('class');  
  index_hole_diameter = val;
  update_geometry();
}


function add_dividing_ring(radius='', count='') {
  var tbody = document.querySelector('#dividing-rings table tbody');
  var tr = document.createElement('tr');
  function td(value, key) {
    var td = document.createElement('td');
    tr.appendChild(td);
    if (key) {
      td.setAttribute('class', key);
      var input = document.createElement('input');
      td.appendChild(input);
      input.setAttribute('type', 'text');
      input.setAttribute('onchange', 'update_dividing_rings()');
      input.value = '' + value;
    } else {
      td.textContent = '' + value;
      td.setAttribute('class', 'angle');
    }
  }
  td(radius, 'radius');
  td(count, 'count');
  if (typeof count === 'string') {
    td('');
  } else {
    td(360 / count);
  }
  tbody.appendChild(tr);
}

/*
ISSUE:  tab order   messed up after sort
*/


function update_dividing_rings() {
  // For each row in the dividing-rings table we extract the radius
  // and number of holes.  We sort that data by radius and then refill
  // the table, calculating the "angle delta" while doing so.  We then
  // make sure we leave a single empty row at the end.
  var ok = true;
  var rows = document.querySelectorAll('#dividing-rings table tbody tr');
  var data = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowData = new Map();
    function doDatum(selector, key) {
      var cell = row.querySelector(selector);
      if (cell.value == '')
        return;
      var val = parseFloat(cell.value);
      if (isNaN(val) || val <= 0) {
        ok = false;
        cell.setAttribute('class', 'BadInput');
        return;
      } else {
        cell.removeAttribute('class');
      }
      rowData.set(key, val);
    }
    doDatum('td.radius input', 'radius');
    doDatum('td.count input', 'count');
    if (rowData.size > 0)
      data.push(rowData);
  }
  if (!ok) {
     return;
  }
  // The data is good.  Sort it and update.
  function focus_identifier (input) {
    return (document.evaluate('string(ancestor::td[1]/@class)',
                              input, null, XPathResult.STRING_TYPE,
                              null).stringValue
            + ';' + input.value);
  }
  var focused = focus_identifier(document.activeElement);
  data.sort(function(a, b) {
    var aval = a.get('radius');
    var bval = b.get('radius');
    if (aval < bval) return -1;
    if (aval > bval) return 1;
    return 0;
  });
  for (i = 0; i < data.length; i++) {
    var row = rows[i];        // <tr>
    var datum = data[i];
    row.querySelector('td.radius input').value = '' + (datum.get('radius') || '');
    row.querySelector('td.count input').value = '' +  (datum.get('count') || '');
    row.querySelector('td.angle').textContent = '' +  (360 / datum.get('count') || '');
  }
  // Add an empty row so the user can add more.
  if (data.length >= rows.length) {
    add_dividing_ring();
  }
  // Refocus
  var inputs = document.querySelector('#dividing-rings table tbody input')
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    if (focus_identifier(input) == focused &&
        input.getAttribute('class') == focused_class) {
      input.focus();
    }
  }
  // Show
  update_hole_locations_table(data);
  dividing_ring_data = data;
  update_geometry();
}


function add_hole_location_rows(radius, count) {
  var tbody = document.querySelector('#hole-locations tbody');
  for (var hole_number = 0; hole_number < count; hole_number++) {
    var tr = document.createElement('tr');
    if (hole_number == 0) {
      tr.setAttribute('class', 'new-ring');
    }
    function td(text, cls) {
      var elt = document.createElement('td');
      tr.appendChild(elt);
      elt.setAttribute('class', cls);
      elt.textContent = '' + text;
      return elt;
    }
    var angle = hole_number * 360 / count;
    if (hole_number == 0) {
      var cell = td(radius, 'radius');
      cell.setAttribute('rowspan', '' + count);
      var cell = td(count, 'count');
      cell.setAttribute('rowspan', '' + count);
    }
    td(hole_number, 'count');
    td(angle, 'angle');
    var radians = angle * Math.PI / 180;
    td(fround(radius * Math.cos(radians, 'pos')));
    td(fround(radius * Math.sin(radians, 'pos')));
    tbody.appendChild(tr);
  }
}


function update_hole_locations_table(data) {
  var tbody = document.querySelector('#hole-locations tbody');
  // First remove previous rows:
  while (tbody.firstChild)
    tbody.firstChild.remove();
  // Now add rows fr the new data
  data.forEach(function(d) {
    add_hole_location_rows(d.get('radius'), d.get('count'));
  });
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
    // center hole
    if (plate_diameter)
      outside_cut(circle(g, 0, 0, (plate_diameter / 2)));
    // outer circumference
    if (center_hub_diameter)
      inside_cut(circle(g, 0, 0, (center_hub_diameter / 2)));
    // Cwnter mark
    guide_line(path(g, [
      ['M', 0, 0],
      ['h', center_hub_diameter/4],
      ['M', 0, 0],
      ['h', -center_hub_diameter/4],
      ['M', 0, 0],
      ['v', center_hub_diameter/4],
      ['M', 0, 0],
      ['v', -center_hub_diameter/4]
    ]));
    // Dividing rings
    var rings_group = document.createElementNS(svgURI, 'g');
    g.appendChild(rings_group);
    var tick = 0.2 * (plate_diameter - center_hub_diameter) / 2;
    for (var i = 1; i < dividing_ring_data.length; i++) {
      var delta = (dividing_ring_data[i].get('radius') -
                   dividing_ring_data[i-1].get('radius')) / 4;
      if (delta < tick)
        tick = delta;
    }
    for (var i = 0; i < dividing_ring_data.length; i++) {
      var ring = dividing_ring_data[i];
      var rg = document.createElementNS(svgURI, 'g');
      rings_group.appendChild(rg);
      var radius = ring.get('radius');
      var count = ring.get('count');
      var angle_delta = 2 * Math.PI / count;
      for (var angle = 0; angle < 2 * Math.PI; angle += angle_delta) {
        var dx = Math.cos(angle);
        var dy = Math.sin(angle);
        var hole_x = radius * dx;
        var hole_y = radius * dy;
        if (index_hole_diameter == 0) {
          // Sam at Shaper Support suggested using an angled path to
          // mark hole centers.  By "aiming" Shaper Origin behind an
          // acute angle, using a V bit, and plunging and retracting
          // without any lateral motion, a center mark can be made for
          // later drilling.
          var a1 = angle - Math.PI / 4;
          var a2 = angle + Math.PI / 4;
          var caret = 0.1;
          var cp = on_line_cut(path(rg, [
              ['M',
               hole_x + caret * Math.cos(a1),
               hole_y + caret * Math.sin(a1)],
              ['L', hole_x, hole_y],
              ['L',
               hole_x + caret * Math.cos(a2),
               hole_y + caret * Math.sin(a2)]
          ]));
            cp.setAttribute('stroke-width', '1px');
            cp.setAttribute("vector-effect", "non-scaling-stroke");
        } else {
          if (index_hole_diameter) {
            inside_cut(circle(rg, hole_x, hole_y,
                              index_hole_diameter / 2));
          }
          guide_line(path(rg, [
              ['M', (radius - tick) * Math.cos(angle),
               (radius - tick) * Math.sin(angle)],
              ['L', (radius + tick) * Math.cos(angle),
               (radius + tick) * Math.sin(angle)],
          ]));
        }
      }
      guide_line(circle(rg, 0, 0, radius));
    }
    svg_elt.appendChild(g);
  }

};


function circle(parent, center_x, center_y, radius) {
  var c = document.createElementNS(svgURI, 'circle');
  c.setAttribute('r', '' + radius);
  c.setAttribute('cx', '' + center_x);
  c.setAttribute('cy', '' + center_y);
  parent.appendChild(c);
  return c;
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

function contentLoaded() {
  console.log('contentLoaded');
  add_dividing_ring();
  geometry = new Geometry();
  setSVGNamespaces();
  update_units();
}

document.addEventListener("DOMContentLoaded", contentLoaded, false);

