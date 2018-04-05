#!python3

import argparse
import json
import os.path
import xml.dom
import xml.dom.minidom


parser = argparse.ArgumentParser(description='Make HTML sample files for Hershey fonts.')

parser.add_argument('json_font_file', type=str, nargs='+', action='store',
                    help='A file as written by extract_font.py')


def load_font(filename):
  reader = open(filename, "r")
  font = json.load(reader)
  reader.close()
  return font


javascript = '''
*/

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

/* '''

def pretty_path(pathtext):
  result = ''
  for c in pathtext:
    if len(result) > 0 and c.isalpha():
      result += '\n'
    result += c
  return result

def write_sample(font, output_file):
  doc = xml.dom.getDOMImplementation().createDocument('http://www.w3.org/1999/xhtml', "html", None)
  html = doc.documentElement

  def elt(parent, tag, namespace=None):
    if namespace:
      e = doc.createElementNS(namespace, tag)
    else:
      e = doc.createElement(tag)
    parent.appendChild(e)
    return e

  def text(parent, txt):
    t = doc.createTextNode(txt)
    parent.appendChild(t)

  head = elt(html, 'head')
  text(elt(head, 'title'), font['name'])
  script = elt(head, 'script')
  script.setAttribute('type', 'text/javascript')
  script.appendChild(doc.createTextNode('/* '))
  script.appendChild(doc.createCDATASection(javascript))
  script.appendChild(doc.createTextNode(' */'))
  body = elt(html, 'body')
  chars_table = elt(body, 'table')
  chars_table.setAttribute('id', 'glyphs')
  chars_table.setAttribute('border', '1')
  index = 0
  for char in font['chars']:
    row = elt(chars_table, 'tr')
    col1 = elt(row, 'td')
    # Column 1: indexes, character codes
    col1.setAttribute('valign', 'top');
    col1.setAttribute('align', 'right');
    text(col1, '%d.' % index)
    elt(col1, 'br')
    text(col1, '0x%x' % index)
    elt(col1, 'br')
    text(col1, 'ASCII 0x%02x' % (index + 33))
    elt(col1, 'br')
    text(col1, '"%c"' % chr(index + 33))
    # Column 2: metrics.  Most are added by javascript code above.n
    col2 = elt(row, 'td')
    col2.setAttribute('class', 'metrics')
    col2.setAttribute('valign', 'top');
    col2.setAttribute('align', 'left');
    text(col2, 'o = %d' % char['o'])
    elt(col2, 'br')
    # Column 3: SVG rendering of the glyph
    col3 = elt(row, 'td')
    svg = elt(col3, 'svg', 'http://www.w3.org/2000/svg')
    g = elt(svg, 'g')
    path = elt(g, 'path')
    path.setAttribute('d', char['d'])
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'black')
    path.setAttribute('stroke-width', '1px')
    # Column 4: The SVG path
    col4 = elt(row, 'td')
    col4.setAttribute('valign', 'top');
    col4.setAttribute('align', 'left');
    text(elt(col4, 'pre'), pretty_path(char['d']))

    index += 1
  out = open(output_file, 'w')
  doc.writexml(out, indent='', addindent='  ', newl='\n')
  out.close()


def main():
  args = parser.parse_args()
  for f in args.json_font_file:
    font = load_font(f)
    out = os.path.splitext(f)[0] + '.html'
    write_sample(font, out)

if __name__ == "__main__":
  main()

