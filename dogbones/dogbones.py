#!python3

# Read an SVG file and add dogbones to the joints.

import argparse
import cmath
import math
import os.path
import sys
import tkinter
import xml.dom
import xml.dom.minidom
from collections import defaultdict

# pip install svg.path
import svg.path


# The diameter of the router bit
cutter_diameter = 0.125

# Give the dogbone some minimal thickness to appease Shaper Origin
dogbone_base = 0.005

# Extra length to be added to the calculated length of the dogbones if
# the calculated length is found to not be sufficient
extra = 0.0

parser = argparse.ArgumentParser(description='Add dogbones to an SVG file of Shaper Origin cut paths.')

parser.add_argument('input_file', type=str, nargs=None, action='store',
                    help='An SVG file of cut paths for Shaper Origin.')

parser.add_argument('--cutter_diameter', type=float, nargs=None, action='store',
                    default=cutter_diameter,
                    help='Diameter of the cutter bit.')

parser.add_argument('--dogbone_base', type=float, nargs=None, action='store',
                    default=dogbone_base,
                    help='The width of the dogbone at the corner it extends from.')

parser.add_argument('--extra', type=float, nargs=None, action='store',
                    default=extra,
                    help='Additional depth to be added to each dogbone.')


# svg.path represents points as complex numbers

def pointX(cplx):
  '''pointX extracts the X coordinate (real component) from a complex number.'''
  return cplx.real

def pointY(cplx):
  '''pointY extracts the Y coordinate (imaginary component) from a complex number.'''
  return cplx.imag

def cplxPoint(x, y):
  return complex(x, y)

def unitVector(cplx):
  return cplx / cmath.polar(cplx)[0]

def perpendicular(cplx):
  return cplxPoint(- pointY(cplx), pointX(cplx))

def dotProduct(cplx1, cplx2):
  return (pointX(cplx1) * pointX(cplx2) +
          pointY(cplx1) * pointY(cplx2))


class Directionizer (object):
  '''Directionizer rounds an angle to one of eight directions.'''
  def __init__(self):
    self.directions = 8
  # The from... methods convert a direction expresses as the "from" units to
  # a direction number (0...8).
  def fromUnity(self, n):
    return (round(float(n) * self.directions)) % 8
  def fromRadians(self, r):
    return self.fromUnity(r / (2 * math.pi))
  def fromDegrees(self, d):
    return self.fromUnity(d / 360)
  # The to... methods convert from a direction number to the specified units.
  def toUnity(self, d):
    return d  / self.directions
  def toRadians(self, d):
    return self.toUnity(d) * 2 * math.pi
  def toDegrees(self, d):
    return self.toUnity(d) * 360
  def toUnitVector(self, d):
    return cplxPoint(math.cos(self.toRadians(d)),
                     math.sin(self.toRadians(d)))


class Transformer (object):
  '''Transform between SVG and cancvas coordinates.'''
  def __init__(self):
    self.scale = 200.0
    self.xOffset = 20.0
    self.yOffset = 20.0

  def toSVG(self, x, y):
    '''Translate event X and Y coordinates to SVG coordinates.'''
    return (float(x) - self.xOffset)/self.scale, (float(y) - self.yOffset)/self.scale

  def toCanvas(self, x, y):
    return self.xOffset + self.scale * float(x), self.yOffset + self.scale * float(y)


directionizer = Directionizer()
transformer = Transformer()


def cleanupPath(p):
  '''svg.path.Path has some quirks which are problematic for us.
     We try to address those here.'''
  for step in p:
    if isinstance(step, svg.path.Line):
      cleanupLine(step)
      # Remove zero length lines
      if step.length() == 0.0:
        p.remove(step)

# svg.path seems to produce a lot of ridiculous floating point numbers
# that don't quite match each other from line to line.  Here we round
# line endpoints to the nearest 0.0001.

def cleanupLine(line):
  line.start = cleanupPoint(line.start)
  line.end = cleanupPoint(line.end)

def cleanupPoint(cmplx):
  return cplxPoint(cleanupFloat(pointX(cmplx)),
                   cleanupFloat(pointY(cmplx)))

def cleanupFloat(f):
  return round(f, 4)


class Corner (object):
  '''Corner represents a single corner in an SVG path.'''
  def __init__(self, pathholder, cplxpoint, line1, line2):
    self.pathholder = pathholder
    self.x = pointX(cplxpoint)
    self.y = pointY(cplxpoint)
    # line1 should end at the Corner and line2 should start at the Corner
    if line1.start == cplxpoint:
      self.line2 = line1
      self.line1 = line2
    else:
      self.line1 = line1
      self.line2 = line2
    # dogbone_direction will be a number from 0 to 8
    self.dogbone_direction = None

  def distance(self, x, y):
    dx = self.x - float(x)
    dy = self.y - float(y)
    return math.sqrt(dx * dx + dy * dy)

  def __str__(self):
    return "%s(%f, %f, %r %r %r)" % (self.__class__.__name__, self.x, self.y, self.dogbone_direction, self.line1, self.line2)

  def make_dogbone(self):
    if self.dogbone_direction is None: return
    print("make_dogbone before %s" % self)
    cutter_radius = cutter_diameter * 0.5
    direction_vector = directionizer.toUnitVector(self.dogbone_direction)
    length = (cutter_radius + extra) * direction_vector
    width = (cutter_diameter + dogbone_base) * perpendicular(direction_vector)
    # Width should have the same sign as the transition from the first
    # leg of the corner to the second
    vector1 = unitVector(self.line1.end - self.line1.start)
    vector2 = unitVector(self.line2.end - self.line2.start)
    if dotProduct(width, unitVector(vector1 + vector2)) < 0:
      width = - width
    # We can't just extend to a single point for the dogbone because that will
    # leave an acute angle that is in part narrower than the cutter diameter
    # and Shaper Origin is smart enough to not cut there.
    # Instead we make a rectangular extension.
    #
    # Now open up the base of the dogbone.  For each of self.line1 and self.line2, we move
    # the self.x, self.y endpoint back along that line by the projection of width to that Line
    def backoff(line):
      line_unit_vector = unitVector(line.end - line.start)
      b = line_unit_vector * dotProduct(line_unit_vector, width)
      return b
    # The segments of a parsed path appear to be properly ordered.  We assume this below.
    insertion_index = self.pathholder.parsed_path.index(self.line1)
    self.line1.end = self.line1.end - backoff(self.line1)
    self.line2.start = self.line2.start + backoff(self.line2)
    dogbone1 = self.line1.end + length
    dogbone2 = self.line2.start + length
    self.pathholder.parsed_path.insert(
      insertion_index + 1, 
      svg.path.Line(self.line1.end, dogbone1))
    # It would be more elegant to use a circular arc, but I'm lazy.
    self.pathholder.parsed_path.insert(
      insertion_index + 2, 
      svg.path.Line(dogbone1, dogbone2))
    self.pathholder.parsed_path.insert(
      insertion_index + 3, 
      svg.path.Line(dogbone2, self.line2.start))
    print("make_dogbone after %s" % self)
    for step in self.pathholder.parsed_path[insertion_index:insertion_index + 5]:
      print("step %s" % step)


class PathHolder (object):
  '''One PathHolder is created for each SVG path element.'''
  def __init__(self, path_elt):
    assert path_elt.nodeType == xml.dom.Node.ELEMENT_NODE
    assert path_elt.tagName == "path"
    self.path_elt = path_elt
    self.parsed_path = svg.path.parse_path(self.path_elt.getAttribute("d"))
    cleanupPath(self.parsed_path)
    print("parsed_path %s" % self.parsed_path)
    # Index each Line by its two endpoints.  line_index maps an endpoint
    # to the Lines that hvae that endpoint.
    line_index = defaultdict(list)
    for step in self.parsed_path:
      if isinstance(step, svg.path.path.Line):
        line_index[step.start].append(step)
        line_index[step.end].append(step)
    self.corners = []    # list of Corner objects
    for point, lines in line_index.items():
      if len(lines) == 2:
        self.corners.append(Corner(self, point, lines[0], lines[1]))

  def __str__(self):
    return "%s(%s)" % (self.__class__.__name__, str(self.parsed_path))

  def render(self, gui):
    for step in self.parsed_path:
      if isinstance(step, svg.path.path.Line):
        gui.line(pointX(step.start), pointY(step.start), pointX(step.end), pointY(step.end))

  def update(self):
    print("Updating %s" % self.path_elt.getAttribute("d"))
    self.path_elt.setAttribute("d", self.parsed_path.d())


class PathCollector (object):
  '''PathCollector finds all of the paths in an SVG document.'''
  def __init__(self):
    self.paths = []

  def gather(self, node):
    if isinstance(node, xml.dom.minidom.Element):
      if node.tagName == "path":
        self.paths.append(PathHolder(node))
    if isinstance(node, xml.dom.minidom.Node):
      for child in node.childNodes:
        self.gather(child)

  def render(self, gui):
    print("Rendering %d paths" % len(self.paths))
    for ph in self.paths:
      ph.render(gui)

  def update(self):
    print("Updating %d paths" % len(self.paths))
    for ph in self.paths:
      ph.update()


def canvasButtonDownHandler(event):
  '''canvasButtonHandler is the mouse down event handler for the canvas.'''
  hit_radius = 0.25
  app = event.widget.application
  x, y = transformer.toSVG(event.x, event.y)
  closest = None
  for pc in app.path_collector.paths:
    for corner in pc.corners:
      d = corner.distance(x, y)
      if d <= hit_radius:
        if closest is None:
          closest = (d, corner)
        elif d < closest[0]:
          closest = (d, corner)
  if not (closest is None):
    app.active_corner = (event.x, event.y, closest[1])
  else:
    app.active_corner = None

def canvasButtonUpHandler(event):
  app = event.widget.application
  if not app.active_corner:
    return
  dx = event.x - app.active_corner[0]
  dy = event.y - app.active_corner[1]
  if math.sqrt(dx * dx + dy * dy) < 2:
    app.active_corner = None
    return
  app.active_corner[2].dogbone_direction = directionizer.fromRadians(math.atan2(dy, dx))
  app.active_corner = None
  sys.stdout.flush()


class GUI (object):
  '''GUI contains the application and its state.'''
  def __init__(self, pathCollector):
    assert isinstance(pathCollector, PathCollector)
    self.path_collector = pathCollector
    self.root = tkinter.Tk()
    frame = tkinter.Frame(self.root,
        width=1000,
        height=600,
        background="#000000",
        borderwidth=2)
    frame.pack(fill=tkinter.BOTH)
    self.canvas = tkinter.Canvas(frame)
    self.canvas.pack(fill=tkinter.BOTH)
    self.canvas.application = self
    self.canvas.bind("<Button-1>", canvasButtonDownHandler)
    self.canvas.bind("<ButtonRelease-1>", canvasButtonUpHandler)
    self.active_corner = None

  def line(self, fromX, fromY, toX, toY):
    # eventually apply scaling here
    x1, y1 = transformer.toCanvas(fromX, fromY)
    x2, y2 = transformer.toCanvas(toX, toY)
    self.canvas.create_line(x1, y1, x2, y2, fill="#ffffff")

  def show(self):
    self.path_collector.render(self)

  def run(self):
    self.root.mainloop()


def output_name(input_name):
  base, ext = os.path.splitext(os.path.basename(input_name))
  return os.path.join(os.path.dirname(input_name),
      base + "-dogboned" + ext)


def main():
  global pc
  global app
  global cutter_diameter
  global dogbone_base
  global extra
  args = parser.parse_args()
  cutter_diameter = args.cutter_diameter
  dogbone_base = args.dogbone_base
  extra = args.extra
  dom = xml.dom.minidom.parse(args.input_file)
  pc = PathCollector()
  pc.gather(dom)
  app = GUI(pc)
  app.show()
  app.run()
  for ph in app.path_collector.paths:
    for corner in ph.corners:
      print(str(corner))
      corner.make_dogbone()
  # Now update the DOM paths.
  pc.update()
  # Write the new SVG file
  out = open(output_name(args.input_file), "w")
  dom.writexml(out, addindent="  ", newl="\n")
  out.close()


if __name__ == "__main__":
  main()

