#!python3

# Read an SVG file and add dogbones to the joints.

import argparse
import math
import sys
import tkinter
import xml.dom
import xml.dom.minidom
from collections import defaultdict

# pip install svg.path
import svg.path


parser = argparse.ArgumentParser(description='Add dogbones to an SVG file of Shaper Origin cut paths.')

parser.add_argument('input_file', type=str, nargs=1, action='store',
                    help='An SVG file of cut paths for Shaper Origin.')

parser.add_argument('--cutter_diameter', type=float, nargs=1, action='store',
                    default=0.125,
                    help='Diameter of the cutter bit.')

parser.add_argument('--dogbone_base', type=float, nargs=1, action='store',
                    default=0.005,
                    help='The width of the dogbone at the corner it extends from.')


def pointX(cplx):
  '''pointX extracts the X coordinate (real component) from a complex number.'''
  return cplx.real

def pointY(cplx):
  '''pointY extracts the Y coordinate (imaginary component) from a complex number.'''
  return cplx.imag


class Corner (object):
  '''Corner represents a single corner in an SVG path.'''
  def __init__(self, cplxpoint, line1, line2):
    self.x = pointX(cplxpoint)
    self.y = pointY(cplxpoint)
    self.line1 = line1
    self.line2 = line2
    self.dogbone_direction = None
  pass

  def distance(self, x, y):
    dx = self.x - float(x)
    dy = self.y - float(y)
    return math.sqrt(dx * dx + dy * dy)

  def __str__(self):
    return "%s(%f, %f, %r)" % (self.__class__.__name__, self.x, self.y, self.dogbone_direction)


class PathHolder (object):
  '''One PathHolder is created for each SVG path element.'''
  def __init__(self, path_elt):
    assert path_elt.nodeType == xml.dom.Node.ELEMENT_NODE
    assert path_elt.tagName == "path"
    self.path_elt = path_elt
    self.parsed_path = svg.path.parse_path(self.path_elt.getAttribute("d"))
    line_index = defaultdict(list)
    for step in self.parsed_path:
      if isinstance(step, svg.path.path.Line):
        line_index[step.start].append(step)
        line_index[step.end].append(step)
    self.corners = []  # of Corner
    for point, lines in line_index.items():
      if len(lines) == 2:
        self.corners.append(Corner(point, lines[0], lines[1]))

  def __str__(self):
    return "%s(%s)" % (self.__class__.__name__, str(self.parsed_path))

  def render(self, gui):
    for step in self.parsed_path:
      if isinstance(step, svg.path.path.Line):
        gui.line(pointX(step.start), pointY(step.start), pointX(step.end), pointY(step.end))


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


def canvasButtonDownHandler(event):
  '''canvasButtonHandler is the mouse down event handler for the canvas.'''
  hit_radius = 0.25
  app = event.widget.application
  x, y = app.transformer.toSVG(event.x, event.y)
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
  app.active_corner[2].dogbone_direction = app.directionizer.fromRadians(math.atan2(dy, dx))
  print("Direction %f %f   %f" % (dx, dy, direction))
  app.active_corner = None
  sys.stdout.flush()


class Directionizer (object):
  '''Directionizer rounds an angle to one of eight directions.'''
  def __init__(self):
    self.directions = 8
  def fromUnity(self, n):
    return round(float(n) * self.directions) / self.directions
  def fromRadians(self, r):
    return self.fromUnity(r / (2 * math.pi)) * 2 * math.pi
  def fromDegrees(self, d):
    return self.fromUnity(d / 360) * 360


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


class GUI (object):
  '''GUI contains the application and its state.'''
  def __init__(self, pathCollector):
    assert isinstance(pathCollector, PathCollector)
    self.transformer = Transformer()
    self.directionizer = Directionizer()
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
    # print("%f %f %f %f" % (fromX, fromY, toX, toY))
    x1, y1 = self.transformer.toCanvas(fromX, fromY)
    x2, y2 = self.transformer.toCanvas(toX, toY)
    self.canvas.create_line(x1, y1, x2, y2, fill="#ffffff")

  def show(self):
    for ph in self.path_collector.paths:
      ph.render(self)

  def run(self):
    self.root.mainloop()


def main():
  global pc
  global app
  args = parser.parse_args()
  dom = xml.dom.minidom.parse(args.input_file[0])
  pc = PathCollector()
  pc.gather(dom)
  print(str(pc.paths))
  app = GUI(pc)
  app.show()
  app.run()
  for pc in app.path_collector.paths:
    for corner in pc.corners:
      print("%s" % corner)

  # dom.writexml(sys.stdout, addindent="  ", newl="\n")


if __name__ == "__main__":
  main()

