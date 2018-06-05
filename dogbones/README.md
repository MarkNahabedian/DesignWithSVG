dogbones.py can be used to add dogbones to an SVG file.

Running the command

<pre>
  dogbones.py --cutter_diameter 0.125 my-design.svg
</pre>

first parses the SVG file and displays the lines that are present
in the SVG paths in the file.

Each corner will have tyhree blue dots near it, each in a possible
dogbone direction.  Click on a dot to add a dogbone in that direction.
The clicked on dot turns from blue to green.

When dogbone selection is complete the user closes the display window.
A new SVG file is then written out.  For the example above, that file
would be named <tt>my-design-dogboned.svg</tt>.


I got this program working well enough for my own projects.  It has a
number of limitations:

* only considers SVG line segments.  Ignores arcs, rectangles, etc.
  These will be preserved in the output but are not displayed and can
  not be adjacent to a dogbone.
