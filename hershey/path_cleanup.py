#!python3

# Read a Hershey font from a JSON file and optimize the paths for
# rendering with Shaper Origin.

import argparse
import json

# pip install svg.path
import svg.path


def cleanup_font_paths(font):
  for char in font['chars']:
    fixed = fix_path(svg.path.parse_path(char['d']))
    del char['d']
    char['paths'] = [f.d() for f in fixed]


# load_font reads a json file as written by extract_font.py
def load_font(filename):
  reader = open(filename, "r")
  font = json.load(reader)
  reader.close()
  return font


font_name_translation = str.maketrans(' ', '_')

def save_font(font):
  name = font['name']
  name = name.translate(font_name_translation)
  out = open(name + '-cleaned_up' + '.json', mode='w')
  json.dump(font, out)
  out.close()


class LineGroup(object):
  def __init__(self, lines):
    self.lines = lines
    self.check()
  def __repr__(self):
    return 'LineGroup(%r)' % self.lines
  def __str__(self):
    return '%d lines from %r to %r' % (len(self.lines), self.start, self.end)
  def __iter__(self):
    return(iter(self.lines))
  @property
  def start(self):
    return self.lines[0].start
  @property
  def end(self):
    return self.lines[-1].end
  def check(self):
    for i in range(len(self.lines) - 1):
      assert self.lines[i].end == self.lines[i+1].start, 'Malformed: %r' % self.lines
  def append(self, line):
    self.lines.append(line)
    self.check()
  def prepend(self, line):
    self.lines.insert(0, line)
    self.check()
  def merge(self, other):
    def reverse(l):
      # list.reverse() is destructive and doesn't return uts result.
      rl = list(l)
      rl.reverse()
      return rl
    def flip(line):
      return svg.path.Line(start=line.end, end=line.start)
    if self.end == other.start:
      for l in other.lines:
        self.append(l)
      return True
    if self.start == other.start:
      for l in other.lines:
        self.prepend(flip(l))
      return True
    if self.end == other.end:
      for l in reverse(other.lines):
        self.append(flip(l))
      return True
    return False


# fix_path transforms a parsed SVG path to an equivalent one that is
# easier to cut on Shaper Origin.
# The result is a list of parsed paths to avoid confusing Shaper Origin.
def fix_path(parsed):
  # Expect every element to be a Line:
  for exp in parsed:
    if not isinstance(exp, svg.path.Line):
      raise Exception('Unsupported SVG path component: %r' % exp)
  # Arrange the lines so that they line up end to end
  linegroups = [LineGroup([line]) for line in parsed]
  i = 0
  while True:
    if i >= len(linegroups):
      break
    lg1 = linegroups[i]
    merge = False
    for lg2 in linegroups:
      if lg1 == lg2:
        continue
      if lg1.merge(lg2):
        linegroups.remove(lg2)
        merge = True
        break
    if not merge:
      i += 1
      continue
  result = []
  for lg in linegroups:
    p = svg.path.Path()
    result.append(p)
    for l in lg:
      p.append(l)
  return result


def test(p, expect):
  parsed = svg.path.parse_path(p)
  expectp = [svg.path.parse_path(e) for e in expect]
  fixed = fix_path(parsed)
  if not (fixed == expectp):
    print('FAIL', parsed.d(), '\n', fixed.d(), '\n\n')

test('M0,0 L1,0  M1,1 L1,0', ['M0,0 L1,0 L1,1']) # end - end
test('M0,0 L0,1  M0,1 L1,1', ['M0,0 L0,1 L1,1']) # end - start
test('M0,0 L1,0  M0,0 L1,1', ['M1,1 L0,0 L1,0']) # start - start
test('M4,1 L4,22 M4,1 L12,22 M20,1 L12,22 M20,1 L20,22',
     ['M4,22 L4,1 L12,22 L20,1 L20,22'])
test('M15,8 L15,22 M15,11 L13,9 11,8 8,8 6,9 4,11 3,14 3,16 4,19 6,21 8,22 11,22 13,21 15,19',
     ['M15,8 L15,22', 'M15,11 L13,9 L11,8 L8,8 L6,9 L4,11 L3,14 L3,16 L4,19 L6,21 L8,22 L11,22 L13,21 L15,19'])


parser = argparse.ArgumentParser(description='Cleanup the paths in a Hershey font JSON file for Shaper Origin.')

parser.add_argument('json_font_file', type=str, nargs='+', action='store',
                    help='A file as written by extract_font.py')


def main():
  args = parser.parse_args()
  for f in args.json_font_file:
    font = load_font(f)
    cleanup_font_paths(font)
    save_font(font)


if __name__ == "__main__":
  main()

