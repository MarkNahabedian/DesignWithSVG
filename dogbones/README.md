dogbones.py can be used to add dogbones to an SVG file.


# Requirements

dogbones.py uses tkinter to provide a simple graphical user interface.

dogbones.py requires the svg.path module:

<pre>
pip install svg.path
</pre>


# Usage

Running the command

<pre>
  dogbones.py --cutter_diameter 0.125 my-design.svg
</pre>

first parses the SVG file and displays the lines that are present
in the SVG paths in the file.

Each corner will have three blue dots near it, each in a possible
dogbone direction.  Click on a dot to add a dogbone in that direction.
The clicked on dot turns from blue to green.  Click near the corner
but not on a dot to cancel the dogbone for that corner.

When dogbone selection is complete the user closes the display window.
A new SVG file is then written out.  For the example above, that file
would be named <tt>my-design-dogboned.svg</tt>.

There are additional commandline arguments that can be used to make
each dogbone wider and deeper than those sugfgested by the cutter
diameter.  Run

<pre>
dogbones.py --help
</pre>

for details.


# Limitations

I got this program working well enough for my own projects.  It has a
number of limitations:

* only considers SVG line segments.  Ignores arcs, rectangles, etc.
  These will be preserved in the output but are not displayed and can
  not be adjacent to a dogbone.
