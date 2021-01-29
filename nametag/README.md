# Motivation

I wanted to make some nametags for an event that my girlfriend and I
would be attending.  nametag.html is a web page that generates the SVG
so that one can cut a nametag on Shaper Origin.


# Usage

nametag.html requires no server side support.  You can run it from a
"file:" URL or directly from
<a href="https://marknahabedian.github.io/DesignWithSVG/nametag/nametag.html">Github Pages</a>.

You must first select a Hershey vector font from a file (see
../hershey/README.md for more on these font files) using the file
chooser.  If you run from Github Pages you can just click on one of
the isted fonts to load it.

Once the font file is chosen, enter the name or short amount of text
to be rendered.  This utility can only deal with a single line of
text.

You will probably need to add additional spacing for each letter
pair.  See below.

You can also specify some borders, the outermost of which will
be the outline for cutting the nametag free of the stock.

Both the image and the SVG code that renders it can be found on the
page.  You can copy the SVG code directly from the serialized section
of the page to a file for cutting.  A "Copy SVG to clipboard" button
is provided for convenience.

After importing and placing the file for cutting on Shaper Origin,
you'll need to specify the cut types, which should be on-line for all
cuts but the outermost one, which should be an outside cut.


# Kerning

You'll find you'll need to adjust the character spacing.  The kerning
element of the input form takes one line for each glyph pair and the
amount of space (in the same units as the font is defined in) to be
added between that pair of glyphs.  Some adjustments for the sans
seriph single stroke font can be found in
../hershey/fonts/Sans_1-stroke.kerning.  The contents of this file can
be pasted directly into the kerning textarea of the webpage.  When a
font is loaded the available kerning data for it is also loaded.


# Borders

The only border style currently supported is "rectangular" with optional
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
with right angle corners.  The outermost border will be defined with
an outside rather than an on-line cut.


# Example

Here is an example of the SVG output with input text "Mark" and a
rounded rectangle border and cut path:

<img src="example-Mark.svg" />

Here is a picture of the resulting nametag, cut using the 60 degree V
engraving bit that comes with Shaper Origin:

<img src="example-Mark-cut.jpg" size="100%" />

