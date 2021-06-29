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
    shape.setAttribute('fill', 'white');
    shape.setAttribute('stroke', 'black');
    shape.setAttribute('stroke-width', '.01');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function outside_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', 'black');
    shape.setAttribute('stroke', 'black');
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
    shape.setAttribute('stroke', 'gray');
    // shape.setAttribute('stroke-width', '.01');  This messes up display
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

function pocket_cut(shape) {
  if (DEBUG_PATHS) {
    shape.setAttribute('class', 'debug-shapes');
  } else {
    shape.setAttribute('fill', 'gray');
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
    shape.setAttribute('stroke', 'blue');
    shape.setAttribute('stroke-width', '.01');
    shape.setAttribute('opacity', '1.0');
  }
  return shape;
}

