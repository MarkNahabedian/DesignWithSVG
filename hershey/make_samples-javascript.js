var domrect_keys = ['x', 'y', 'width', 'height' /* , 'left', 'right', 'top', 'bottom' */ ];

function contentLoaded() {
  var rows = document.querySelectorAll('table#glyphs tr');
  for (var rownum = 0; rownum < rows.length; rownum++) {
    var row = rows[rownum];
    var path = row.querySelector('svg path');
    var metrics = row.querySelector('.metrics');
    var bbox = path.getBBox();
    var any = false;
    domrect_keys.map(function(key) {
      if (any) {
        metrics.appendChild(document.createElement('br'));
      }
      metrics.appendChild(document.createTextNode(
          key + ':  ' + bbox[key]))
      any = true;
    });

  }
}

document.addEventListener("DOMContentLoaded", contentLoaded, false);
