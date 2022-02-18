var domrect_keys = ['x', 'y', 'width', 'height' /* , 'left', 'right', 'top', 'bottom' */ ];

function contentLoaded() {
  var rows = document.querySelectorAll('table#glyphs tr');
  for (var rownum = 0; rownum < rows.length; rownum++) {
    var row = rows[rownum];
    var path = row.querySelector('svg path');
    var metrics = row.querySelector('.metrics');
    var bbox = path.getBBox();
    console.log(metrics, bbox);
    domrect_keys.map(function(key) {
      metrics.appendChild(document.createTextNode(key + ':'));
      metrics.innerHTML += '&nbsp';
      metrics.appendChild(document.createTextNode(bbox[key]))
      metrics.appendChild(document.createElement('br'));
    });

  }
}

document.addEventListener("DOMContentLoaded", contentLoaded, false);
