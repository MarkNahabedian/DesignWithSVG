#!python3

# Read an SVG file and add dogbones to the joints.

import argparse
import sys
import tkinter
import xml.dom
import xml.dom.minidom

# pip install svg.path
import svg.path


parser = argparse.ArgumentParser(description='Add dogbones to an SVG file of Shaper Origin cut paths.')

parser.add_argument('input_file', type=str, nargs=1, action='store',
                    help='An SVG file of cut paths for Shaper Origin.')

parser.add_argument('--cutter_diameter', type=float, nargs=1, action='store',
                    default=0.125,
                    help='Diameter of the cutter bit.')

def pointX(cplx):
  return cplx.real

def pointY(cplx):
  return cplx.imag


class PathHolder (object):
  def __init__(self, path_elt):
    assert path_elt.nodeType == xml.dom.Node.ELEMENT_NODE
    assert path_elt.tagName == "path"
    self.path_elt = path_elt
    self.parsed_path = svg.path.parse_path(self.path_elt.getAttribute("d"))

  def __str__(self):
    return "%s(%s)" % (self.__class__.__name__, str(self.parsed_path))

  def render(self, gui):
    for step in self.parsed_path:
      if isinstance(step, svg.path.path.Line):
        gui.line(pointX(step.start), pointY(step.start), pointX(step.end), pointY(step.end))
      pass
    pass


class PathCollector (object):
  def __init__(self):
    self.paths = []

  def gather(self, node):
    if isinstance(node, xml.dom.minidom.Element):
      if node.tagName == "path":
        self.paths.append(PathHolder(node))
    if isinstance(node, xml.dom.minidom.Node):
      for child in node.childNodes:
        self.gather(child)


class GUI (object):
  def __init__(self, pathCollector):
    assert isinstance(pathCollector, PathCollector)
    self.scale = 200
    self.xOffset = 20
    self.yOffset = 20
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

  def line(self, fromX, fromY, toX, toY):
    # eventually apply scaling here
    # print("%d %d %d %d" % (fromX, fromY, toX, toY))
    self.canvas.create_line(
        self.xOffset+self.scale*fromX, self.yOffset+self.scale*fromY,
        self.xOffset+self.scale*toX, self.yOffset+self.scale*toY,
        fill="#ffffff")

  def show(self):
    for ph in self.path_collector.paths:
      ph.render(self)

  def run(self):
    self.root.mainloop()


def main():
  global pc
  args = parser.parse_args()
  dom = xml.dom.minidom.parse(args.input_file[0])
  pc = PathCollector()
  pc.gather(dom)
  print(str(pc.paths))
  ui = GUI(pc)
  ui.show()
  ui.run()

  # dom.writexml(sys.stdout, addindent="  ", newl="\n")


if __name__ == "__main__":
  main()

