These are some tools I've written for creating vector graphics designs
to be cut using a laser cutter or CNC router.

The primary focus of these tools is the Shaper Origin, a hand held CNC
router that takes SVG files for descrribing the cutting and engraving
paths.

Being a computer programmer, I prefer to define my designs using code
to describe exactly what I want, rather than using a graphical user
interface.

<b>common</b> provides a library of JavaScript functions for
describing a design programatically.  I typically create an HTML file
that imports this library and adds additional JavaScript code to
define a particular design.  That web page can then show both a
graphical rendering of the SVG and the SVG code itself for copying out
to a file. 

<b>hershey</b> provides tools for working with Hershey vector fonts:
converting them to SVG, displaying samples, and rendering text for
Shaper Origin.

<b>nametag</b> contains a utility for cutting an engraving a nametag
using Shaper Origin or other engraving/etching device.

<b>dogbones</b> provides a python program for adding dogbones (rotary
cutters can not cut internal corners) to mortises and tenons in an
existing SVG design.

The remaining utilities are works in progress.  They are not yet
working to my satisfaction.

