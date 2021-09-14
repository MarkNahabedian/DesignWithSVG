### A Pluto.jl notebook ###
# v0.14.9

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

# ╔═╡ 0b6a9f58-d52e-4226-85a3-89ed73a41481
begin
	using Pkg
	# *** We need a way to refer to the activated workspace that works both locally and from GitHub
	Pkg.activate("c:/Users/Mark Nahabedian/Documents/svg-design/floor_drain")
	
	using Markdown
	using InteractiveUtils
	using Unitful
	using UnitfulUS
	using NativeSVG
	using ShaperOriginDesignLib
	using PlutoUI
end

# ╔═╡ 4d4caff2-14aa-11ec-20fa-0d12a3b75e3b
md"
# Floor Drain -- Laundry Room

## Measurements

The actual drain hole has a top diameter of 2.85 inch.

About 0.5 inch below the surface of the floor is a lip that extends in
about 0.48 inch from the circumference of the outer diameter.

I have a sheet of aluminum that is crudely measured (because ut was
taped doen to a spoil board) to a bit over 0.05 inch.

"

# ╔═╡ 8ca9dfe1-5582-4cbf-b4ef-5ff4516459ed
md"
## Measurements
"

# ╔═╡ 221a5c19-14d2-4771-8f30-75e11e31b701
begin
	# At the floor's surface is a hole that is
	OUTER_DIAMETER = 2.85u"inch"

	# Below the surface of the floor is a lip that will support our drain plate
	LIP_DEPTH = 0.5u"inch"
	
	# That lip extends invard by about
	LIP_LENGTH = 0.48u"inch"
end

# ╔═╡ c328f0ac-95fa-40ef-a8fc-9cf2d37ab053
md"
## Drain Hole Profile
"

# ╔═╡ 697159f0-176c-4272-bd04-d8e004ac1caa
function drain_hole_profile()
	io = IOBuffer()
	floor_margin = 1u"inch"
	y_margin = 0.25u"inch"
	drain_descent = 0.5u"inch"
	centerline_style = "fill: none; stroke: green; stroke-width: 0.01; stroke-dash-array: '10,10'"
	profile_style = "fill: none; stroke: black; stroke-width: 0.05"
	svg(io;
		xmlns=ShaperOriginDesignLib.SVG_NAMESPACE,
		viewBox = pathd(
			- OUTER_DIAMETER - floor_margin,
			- y_margin,
			2 * (OUTER_DIAMETER + floor_margin),
			LIP_DEPTH + drain_descent + 2 * y_margin),
		style="background-color: pink") do
		g(io) do
			# center line
			path(io; d = pathd(
					["M", 0, - y_margin],
					["V", LIP_DEPTH + drain_descent + 2 * y_margin]
					),
				style=centerline_style)
			path(io; d = pathd(
					["M", - OUTER_DIAMETER - floor_margin, y_margin],
					["h", floor_margin],
					["v", LIP_DEPTH],
					["h", LIP_LENGTH],
					["v", drain_descent]),
				style=profile_style)
			path(io; d = pathd(
					["M", OUTER_DIAMETER + floor_margin, y_margin],
					["h", - floor_margin],
					["v", LIP_DEPTH],
					["h", - LIP_LENGTH],
					["v", drain_descent]
					),
				style=profile_style)
		end
	end
	String(take!(io))
end

# ╔═╡ 838e0ac4-8f49-4074-b040-ab69efcb2250
HTML(drain_hole_profile())

# ╔═╡ 3d0672b8-b236-4cc6-ad26-db87dce336a7
md"""
## Plate Design
"""

# ╔═╡ 7ea60153-0cce-4599-a87c-c5204951dad4
begin
	DRAIN_HOLE_DIAMETER = 0.1u"inch"
	
	DRAIN_HOLE_SPACING = 2.6 * DRAIN_HOLE_DIAMETER
	
	MAX_DRAIN_HOLE_FROM_CENTER = OUTER_DIAMETER / 2 - LIP_LENGTH - DRAIN_HOLE_DIAMETER
end

# ╔═╡ c2149c11-962e-4e72-8ee6-9add50e56151
function drain_plate()
	io = IOBuffer()
	svg_margin = 0.25u"inch"
	svg(io;
		xmlns=ShaperOriginDesignLib.SVG_NAMESPACE,
		viewBox=pathd(
			- svg_margin - OUTER_DIAMETER,
			- svg_margin - OUTER_DIAMETER,
			2 * (svg_margin + OUTER_DIAMETER),
			2 * (svg_margin + OUTER_DIAMETER)),
		style="background-color: pink") do
		g(io) do
			# The perimeter of the plate
			circle(io; cx=0, cy=0,
				r=svgval(OUTER_DIAMETER / 2),
				style=shaper_style_string(:outside_cut))
			circle(io; cx=0, cy=0,
				r=svgval(OUTER_DIAMETER / 2 - LIP_LENGTH),
				style=shaper_style_string(:guide_line))
			# a grid of drain holes
			function hole(x, y)
				circle(io; cx=svgval(x),
					cy=svgval(y),
					r=svgval(DRAIN_HOLE_DIAMETER / 2),
					style=shaper_style_string(:pocket_cut))
			end
			hole_range = 0u"inch" : DRAIN_HOLE_SPACING : (OUTER_DIAMETER / 2)
			for x in hole_range
				for y in hole_range
					if x^2 + y^2 < MAX_DRAIN_HOLE_FROM_CENTER ^ 2
						hole(x, y)
						if x != -x
							hole(-x, y)
						end
						if y != -y
							hole(x, -y)
						end
						if x != -x && y != -y
							hole(-x, -y)
						end
					end
				end
			end
		end
	end
	String(take!(io))
end

# ╔═╡ 414eecf3-7d9e-4da7-b5cf-122a1b260713
HTML(drain_plate())

# ╔═╡ b8252567-b6c0-4194-8d45-2c42cf80b9bc
@bind copy_button PlutoUI.Button("Copy SVG to Clipboard")

# ╔═╡ 44714b33-a6f7-4569-a2db-8c457b8cab28
begin
	copy_button
	doc = drain_plate()
	try
		clipboard(doc)
	catch e
		DisplayAs.Text(doc)
	end
end

# ╔═╡ Cell order:
# ╠═0b6a9f58-d52e-4226-85a3-89ed73a41481
# ╠═4d4caff2-14aa-11ec-20fa-0d12a3b75e3b
# ╟─8ca9dfe1-5582-4cbf-b4ef-5ff4516459ed
# ╠═221a5c19-14d2-4771-8f30-75e11e31b701
# ╟─c328f0ac-95fa-40ef-a8fc-9cf2d37ab053
# ╠═697159f0-176c-4272-bd04-d8e004ac1caa
# ╠═838e0ac4-8f49-4074-b040-ab69efcb2250
# ╟─3d0672b8-b236-4cc6-ad26-db87dce336a7
# ╠═7ea60153-0cce-4599-a87c-c5204951dad4
# ╠═c2149c11-962e-4e72-8ee6-9add50e56151
# ╠═414eecf3-7d9e-4da7-b5cf-122a1b260713
# ╠═b8252567-b6c0-4194-8d45-2c42cf80b9bc
# ╠═44714b33-a6f7-4569-a2db-8c457b8cab28
