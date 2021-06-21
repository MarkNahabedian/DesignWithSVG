### A Pluto.jl notebook ###
# v0.14.7

using Markdown
using InteractiveUtils

# This Pluto notebook uses @bind for interactivity. When running this notebook outside of Pluto, the following 'mock version' of @bind gives bound variables a default value (instead of an error).
macro bind(def, element)
    quote
        local el = $(esc(element))
        global $(esc(def)) = Core.applicable(Base.get, el) ? Base.get(el) : missing
        el
    end
end

# ╔═╡ c0ca1e52-02d8-44ce-af8b-0bdc20c9eebb
begin
	using Pkg
	Pkg.activate(@__DIR__)
	Pkg.add.([
			"DisplayAs",
			"InteractiveUtils",
			"PlutoUI",
			"Printf",
			"Unitful",
			"UnitfulUS",
			Pkg.PackageSpec(
				name="NativeSVG",
				url="https://github.com/MarkNahabedian/NativeSVG.jl")
			])
	using DisplayAs
	using NativeSVG
	using PlutoUI
	using Printf
	using Unitful
	using UnitfulUS
	using InteractiveUtils: clipboard
end

# ╔═╡ e9cd2dd0-cdfd-11eb-237c-7df35911ef8d
md"""
# Mounting Bracket

A btacket for mounting some outdoor solar powered lights to an awning frame.

Also an experiment to see if it is easier to produce SVG files for Shaper Origin from a Pluto Notebook than using JavaScripot on a web page.
"""

# ╔═╡ 4603d6c3-1c6d-4529-8b2c-292ad2362d69
md"""
## Relevant Measurements

The solar panel sits on top of a plastic tube with an outside diameter of 1.175 inches.

The awning frame has two horizontal bars which I can mount to.  The distance between the top of the top bar and the bottom of the bottom bar is 3 inches.  These two bars can be sandwiched between the (vertical) mounting tobe and the bracket I'm designing here -- all held together by a pair of U bolts -- one above, and the other below the horizontal bars.

Two 5/16" by 1 3/8" by 2 1/2" U bolts will hold this all together.

The drill for free fit for a 5/16 - 18 bolt is Q, 0.332 inches.

The distance between centers for these U bolts is 1.618 inches.
"""

# ╔═╡ cb0c03dc-af7b-4593-a7a9-a212749d811e
begin
	crossbarsVerticalClearance = 3u"inch"

	uBoltDiameter = (5/16)u"inch"
	qDrill = 0.332u"inch"
	uBoltCenterSpacing = 1.618u"inch"

	# Center to center distance:
	spacing_between_uBolts = 3.5u"inch"
	
	# Extra width to add a 90 degree bend on an edge to provide
	# vertical stiffness:
	stiffening_fold = 0.5u"inch"
end

# ╔═╡ 19018211-c86b-4d23-a6fc-28d174df59bc
begin
	# Bracket measurements
	bracketHeight = 5u"inch"
	bracketWidth = 4u"inch"
end

# ╔═╡ 811dc6cd-aa32-47fb-a0ce-2febfb6874ce
begin
	# Bracket design constaraints:
	@assert spacing_between_uBolts > crossbarsVerticalClearance + uBoltDiameter
	@assert spacing_between_uBolts > crossbarsVerticalClearance + uBoltDiameter
	@assert bracketWidth > (uBoltCenterSpacing +
		uBoltDiameter + 0.5u"inch" +
		2 * stiffening_fold)
end

# ╔═╡ 97ceecef-83d7-4495-b495-14a4de0b2011
const SVG_MARGIN = 0.5u"inch"

# ╔═╡ 10273f88-e7e0-4dd7-a62b-dd7f1c53b3dd
SVG_NAMESPACE = "http://www.w3.org/2000/svg"

# ╔═╡ 753be613-7b3f-41e8-a1c6-00aa94bbda4f
shaper_cut_attributes = Dict(
	:inside_cut => (
		fill = "white",
		stroke = "black",
		stroke_width = "0.01",
		opacity="1.0"),
	:outside_cut => (
		fill=  "black",
		stroke = "black",
		stroke_width = "0.01",
		opacity = "1.0"
	),
	:on_line_cut => (
		fill=  "none",
		stroke = "gray",
		stroke_width = "0.01",
		opacity = "1.0"
	),
	:on_line_cut => (
		fill=  "none",
		stroke = "gray",
		stroke_width = "0.01",
		opacity = "1.0"
	),
	:pocket_cut => (
		fill=  "gray",
		stroke = "none",
		opacity = "1.0"
	),
	:guide_line => (
		fill=  "none",
		stroke = "blue",
		stroke_width = "0.01",
		opacity = "1.0"
	)
)

# ╔═╡ ace5c1e6-767c-4ce3-b771-a4baa855a5e6
begin
	function svgval(x::Quantity)
		ustrip(Real, u"inch", x)
	end

	function svgval(x::Number)
		x
	end
end

# ╔═╡ 24064a37-98e3-42d4-b32e-d67f9e1caec6
function pathd(steps...)
	d = IOBuffer()
	function putd(token)
		if position(d) > 0
			write(d, " ")
		end
		if token isa String
			write(d, token)
		elseif token isa Symbol
			putd(string(token))
		elseif token isa Quantity
			putd(svgval(token))
		elseif token isa Integer
			@printf(d, "%d", token)
		elseif token isa Number
			@printf(d, "%3f", token)
		else
			throw(Exception("Unsupported pathd token $token"))
		end
	end
	for step in steps
		if step isa Union{Tuple, Vector}
			for token in step
				putd(token)
			end
		else
			putd(step)
		end
	end
	String(take!(d))
end

# ╔═╡ 59234967-4c44-4035-8315-dd8177e0f241
function draw_bracket()
	io = IOBuffer()
	svg(io; xmlns=SVG_NAMESPACE,
		width="90%",
		viewBox=pathd(0, 0,
			bracketWidth + 2 * SVG_MARGIN,
			bracketHeight + 2 * SVG_MARGIN),
			style="background-color: pink") do
		g(io; transform="translate($(svgval(SVG_MARGIN)), $(svgval(SVG_MARGIN)))") do
			path(io; shaper_cut_attributes[:outside_cut]...,
				d=pathd(
					("M", 0, 0),
					("h", bracketWidth),
					("v", bracketHeight),
					("h", - bracketWidth),
					"z"
					))
			centerX = bracketWidth / 2
			centerY = bracketHeight / 2
			function hole(io, x, y, diameter)
				circle(io;
					cx = svgval(x),
					cy = svgval(y),
					r = svgval(diameter / 2),
					shaper_cut_attributes[:inside_cut]...)
			end
			# Holes for U bolts
			function uboltHoles(io, y)
				hole(io, centerX - uBoltCenterSpacing/2, y, qDrill)
				hole(io, centerX + uBoltCenterSpacing/2, y, qDrill)
			end
			dy = spacing_between_uBolts / 2
			uboltHoles(io, centerY - dy)
			uboltHoles(io, centerY + dy)
			# Mark where the folds go:
			g(io) do
				vertical_offset = 0.25u"inch"
				vertical_length = (1/8)u"inch"
				for x in (stiffening_fold /2,
						bracketWidth - stiffening_fold / 2)
					for y in (vertical_offset + vertical_length,
							bracketHeight - vertical_offset)
						path(io; shaper_cut_attributes[:on_line_cut]...,
							d = pathd(("M", x, y),
								("v", - vertical_length)))
					end
				end
			end
		end
	end
	take!(io)
end

# ╔═╡ 30ebbaa3-3be9-47d2-83df-0cec56e4c959
# DisplayAs.SVG(Drawing(draw_bracket())
HTML(String(draw_bracket()))

# ╔═╡ 0997387a-38a1-4e14-ade5-aba4749390d8
@bind foo PlutoUI.Button("Copy SVG to Clipboard")

# ╔═╡ 7f43fd43-4bfe-4ae0-becd-5acd4756595c
begin
	foo
	doc = String(draw_bracket())
	try
		clipboard(doc)
	catch e
		DisplayAs.Text(doc)
	end
end

# ╔═╡ Cell order:
# ╟─e9cd2dd0-cdfd-11eb-237c-7df35911ef8d
# ╠═c0ca1e52-02d8-44ce-af8b-0bdc20c9eebb
# ╟─4603d6c3-1c6d-4529-8b2c-292ad2362d69
# ╠═cb0c03dc-af7b-4593-a7a9-a212749d811e
# ╠═19018211-c86b-4d23-a6fc-28d174df59bc
# ╠═811dc6cd-aa32-47fb-a0ce-2febfb6874ce
# ╠═97ceecef-83d7-4495-b495-14a4de0b2011
# ╠═10273f88-e7e0-4dd7-a62b-dd7f1c53b3dd
# ╠═753be613-7b3f-41e8-a1c6-00aa94bbda4f
# ╠═ace5c1e6-767c-4ce3-b771-a4baa855a5e6
# ╠═24064a37-98e3-42d4-b32e-d67f9e1caec6
# ╠═59234967-4c44-4035-8315-dd8177e0f241
# ╠═30ebbaa3-3be9-47d2-83df-0cec56e4c959
# ╠═0997387a-38a1-4e14-ade5-aba4749390d8
# ╠═7f43fd43-4bfe-4ae0-becd-5acd4756595c
