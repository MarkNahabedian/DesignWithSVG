// Library of functions specific to the use of Shaper Origin.

var EXPORTED_SYMBOLS = [
    'DEBUG_PATHS', 'inside_cut', 'outside_cut',
    'on_line_cut', 'pocket_cut', 'guide_line'
];


// If true then render all paths without fill for debugging.
var DEBUG_PATHS = false;

function inside_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', '#fff');    // white
    shape.setAttribute('stroke', '#000');  // black
    shape.setAttribute('stroke-width', '.01');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function outside_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', '#000');    // black
    shape.setAttribute('stroke', '#000');  // black
    shape.setAttribute('stroke-width', '.01');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function on_line_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', 'none');
    shape.setAttribute('stroke', '#7F7F7F');  // gray
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function pocket_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
      shape.setAttribute('fill', '#7F7F7F');    // gray
    shape.setAttribute('stroke', 'none');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function guide_line(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', 'none');
    shape.setAttribute('stroke', '#0068FF');  // blue
    shape.setAttribute('stroke-width', '.01');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}
