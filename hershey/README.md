# Vector Graphics Text with Hershey Fonts

To engrave text using the Shaper Origin you need to express the glyphs
as SVG paths.  Fortunately in the late 1960s Dr. Allen V. Hershey
defined a variety of vector based fonts in multiple languages.

https://github.com/techninja/hersheytextjs provides the Hershey font
vector data in JSON format and provides some javascript code for
setting text using those fonts.  That project provides many fonts in a
single JSON file that's nearly half a megabyte in size.  For my
purposes I expect to only be using one or two fonts, so I wrote
extract_font.py to pull a single font out.

make_samples.py displays all of the glyphs from one of those extracted
font files complete with their ASCII code and dimensions.  I've
checked in fonts/Sans_1-stroke.html -- the output of make_samples.py
for the single stroke sans seripoh font.

The Shaper Origin requires that each path consist of only a single
subpath that doesn't branch.  path_cleanup.py cleans up the paths in a
JSON font file (as written by extract_font.py) by splitting
discontinuous subpaths into separate path elements and properly
ordering the strokes in each subpath.

render_text.js provides the JavaScript function renderText for
rendering small amounts of text as SVG.  It takes a parent element to
add child SVG elements to, a font as read from a file written by
extract_font.py, a string of text and an optional kerning table.  The
font files do not appear to have the proper spacing between glyphs.
The kerning table allows one to add additional spacing between any
specified pair of characters.  fonts/Sans_1-stroke.kerning contains a
small number of kerning pairs -- those I needed to make some nametags.
