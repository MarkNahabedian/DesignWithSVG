I wanted to make some nametags for an event that my girlfriend and I
would be attending.  nametag.html is a web page that generates the SVG
so that one can cut a nametag on Shaper Origin.  One must select a
Hershey vector font from a file (see ../hershey/README.md for more on
these font files), enter the name or short about of text, add
additional spacing for each letter pair, and specify some orders, the
outermost of which will be the outline for cutting the nametag free of
the stock.

You'll find you'll need to adjust the character spacing.  The kerning
element of the input form takes one line for each glyph pair and the
amount of space (in the same units as the font is defined in) to be
added between that pair of glyphs.  Some adjustments for the sans
seriph single stroke font can be found in
../hershey/fonts/Sans_1-stroke.kerning.  The contents of this file can
be pasted directly into the kerning textarea of the webpage.

The only border style currently supported is rectangular with optional
rounded corners.  Each line in the "decoration" input box wraps the
text of the nametag or previous border in a border of the specified
type with the specified margin within it.  For example the
specification

<pre>
rectangle 0.2 0.2 0.2 0.2
rectangle 0.2 0.2
</pre>

surrounds the text in a rectangle with a 0.2 inch margin between the
most extreme corners of the text and the rectabgle.  That rectabgle
will have rounded corners with a 0.2 inch radius.  The second line
adds another 0.2 inch margin around the previous rectangle, this one
with right angle corners.

Both the image and the SVG code that renders it can be found on the
page.  You cancopy the SVG code directly from the serialized section
of the page to a file for cutting.

After importing and placing the file for cutting on Shaper Origin,
you'll need to specify the cut types, which should be on-line for all
cuts byt the outermost one, which should be an outside cut.
