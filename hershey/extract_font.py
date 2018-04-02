#!python3

import argparse
import json
import sys
import urllib.request


ALL_FONTS = 'https://raw.githubusercontent.com/techninja/hersheytextjs/master/hersheytext.json'

def load_fonts():
  reader = urllib.request.urlopen(ALL_FONTS) 
  fonts = json.load(reader)
  reader.close()
  return fonts

font_name_translation = str.maketrans(' ', '_')

def save_font(font):
  name = font['name']
  name = name.translate(font_name_translation)
  out = open(name + '.json', mode='w')
  json.dump(font, out)
  out.close()


parser = argparse.ArgumentParser(description='Fetching Hershey vector fonts from ' + ALL_FONTS)

parser.add_argument('operation', type=str, nargs=1, action='store',
                    help='"list", "fetch" or "fetch_all"')

parser.add_argument('font_name', type=str, nargs='?', action='store',
                    help='The name of the font to extract')


def main():
  args = parser.parse_args()

  fonts = load_fonts()
  op = args.operation[0]
  if op == 'list':
    print(' '.join(sorted(fonts.keys())))
  elif op == 'fetch':
    font_name = args.font_name
    if font_name == None:
      print('No font name specified.')
      parser.print_help()
      sys.exit(-1)
    font = fonts.get(font_name)
    if not font:
      print('No font named"' + font_name + '".  Use the "list" operation to see what fonts are available.')
      sys.exit(-1)
    save_font(font)
  elif op == 'fetch_all':
    for font in fonts.values():
      try:
        save_font(font)
      except Exception as err:
        print(err)
  else:
    parser.print_help()


if __name__ == "__main__":
  main()

