#!python3

import argparse
import json
import os.path
from yattag import Doc, indent    # pip install yattag


parser = argparse.ArgumentParser(description='Make HTML sample files for Hershey fonts.')

parser.add_argument('json_font_file', type=str, nargs='+', action='store',
                    help='A file as written by extract_font.py')


STYLESHEET = '''
svg {
  background: white;
}

svg path {
  stroke: black;
  fill: black;
}
'''


def load_font(filename):
  reader = open(filename, "r")
  font = json.load(reader)
  reader.close()
  return font

def pretty_path(pathtext):
  result = ''
  for c in pathtext:
    if len(result) > 0 and c.isalpha():
      result += '\n'
    result += c
  return result

def contents(path):
  with open(path, "r") as f:
    return f.read()
    

def write_sample(font, output_file):
  javascript = contents(os.path.join(os.path.dirname(__file__),
                                     "make_samples-javascript.js"))
  doc, tag, text = Doc().tagtext()
  with tag('html'):
    with tag('head'):
      with tag('title'):
        text(font['name'])
      with tag('style', type='text/css'):
        text(STYLESHEET)
      with tag('script', type='text/javascript'):
        # We could do this with a link, but I want the HTML file to be
        # self-contained.
        doc.cdata(javascript)
    with tag('body'):
      with tag('h1'):
        text(font['name'])
      with tag('table', id='glyphs', border='1'):
        index = 0
        for char in font['chars']:
          with tag('tr'):
            with tag('td', valign='top', align='right'):
              # Column 1: indexes, character codes
              text('%d.' % index)
              doc.stag('br')
              text('0x%x' % index)
              doc.stag('br')
              text('ASCII 0x%02x' % (index + 33))
              doc.stag('br')
              text('"%c"' % chr(index + 33))
            with tag('td',
                     ('class', 'metrics'),
                     valign='top', align='left'):
              # Column 2: metrics.  Most are added by javascript code above.n
              text('o = %d' % char['o'])
              doc.stag('br')
            with tag('td'):
              # Column 3: SVG rendering of the glyph
              with tag('svg', xmlns='http://www.w3.org/2000/svg'):
                with tag('g'):
                  doc.stag('path',
                      ('d', char['d']),
                      ('fill', 'none'),
                      ('stroke','black'),
                      ('stroke-width', '1px'))
            with tag('td', valign='top', align='left'):
              # Column 4: The SVG path
              with tag('pre'):
                text(pretty_path(char['d']))
          index += 1
  with open(output_file, 'w') as out:
    out.write(indent(doc.getvalue()));


def main():
  args = parser.parse_args()
  for f in args.json_font_file:
    font = load_font(f)
    out = os.path.splitext(f)[0] + '.html'
    write_sample(font, out)

if __name__ == "__main__":
  main()

