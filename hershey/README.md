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
font files complete with their ASCII code and dimensions.
