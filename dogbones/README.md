dogbones.py can be used to add dogbones to an SVG file.

Running the command

<pre>
  dogbones.py --cutter_diameter 0.125 my-design.svg
</pre>

first parses the SVG file and displays the lines in the file.  The
user can then use the mouse to select corners of that image and the
direction that the dogbone should go in.  They do this by clicking on
a corner and dragging the mouse in the direction that the dogbone
should go.  How far they drag doesn't matter.  The direction is
rounded to the nearest 45 degrees.  Alas, no visual feedback is
provided.  The length of the dogbone is calculated to be just enough
to clear the curve left by the cutter.  When dogbone selection is
complete the user closes the display window.  A new SVG file is then
written out.  For the example above, that file would be named
<tt>my-design-dogboned.svg</tt>.


I got this program working well enough for my own projects.  It has a
number of limitations:

* only considers SVG line segments.  Ignores arcs, rectangles, etc.
  These will be preserved in the output but are not displayed and can
  not be adjacent to a dogbone.

* No visual feedback when selecting dogbone direction.

* It's currently assuned that the legs of the corner are horizontal or
  vertical.

* Currently dogbones parallell to the X or Y axes are not supported,
  only dogbones at 45 degrees to them.

