### A Pluto.jl notebook ###
# v0.16.0

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
	
	# We can't use Pluto's package manager if we require unregistered packages.
	
	Pkg.add(url="https://github.com/MarkNahabedian/NativeSVG.jl")
	using NativeSVG
	
	Pkg.add(url="https://github.com/MarkNahabedian/ShaperOriginDesignLib")
	using ShaperOriginDesignLib
	
	Pkg.add("Unitful")
	using Unitful
	
	Pkg.add("UnitfulUS")
	using UnitfulUS
	
	Pkg.add("PlutoUI")
	using PlutoUI
	
	Pkg.add("DisplayAs")
	using DisplayAs
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

# ╔═╡ d92a58b3-374e-44c4-9b43-d020b39632d7
md"
## Model the Drain Plate
"

# ╔═╡ 6939c928-e375-4305-ba79-6724e5a3983f
# I needed a mechanism to be able to calculate default values of struct
# fields from the values of other struct fields
@Base.kwdef mutable struct FloorDrainPlatePrototype
    outer_diameter                    # required measurement
    outer_clearance = 0.05u"inch"
    lip_depth = 0.5u"inch"
    lip_length                        # required measurement
    drain_hole_diameter = 0.1u"inch"
    drain_hole_spacing = 0.2u"inch"
    max_drain_hole_from_center = nothing
end

# ╔═╡ 625eda88-04ea-4aab-829c-24c29552c1e7
function complete(p::FloorDrainPlatePrototype)
	if p.max_drain_hole_from_center == nothing
		p.max_drain_hole_from_center =
			p.outer_diameter / 2 -
			p.lip_length -
			p.drain_hole_diameter
	end
	return p
end

# ╔═╡ b6bf9e2f-f3cc-4ab5-b9e3-4efb16592c94
struct FloorDrainPlate
	outer_diameter
	outer_clearance
	lip_depth
	lip_length
	drain_hole_diameter
	drain_hole_spacing
	max_drain_hole_from_center
	
	function FloorDrainPlate(p::FloorDrainPlatePrototype)
		complete(p)
		new(
			p.outer_diameter,
			p.outer_clearance,
			p.lip_depth,
			p.lip_length,
			p.drain_hole_diameter,
			p.drain_hole_spacing,
			p.max_drain_hole_from_center)
	end
end

# ╔═╡ 03ca99d7-6fef-426c-a2fe-d65046f357fd
function outer_radius(plate::FloorDrainPlate)
	(plate.outer_diameter / 2) - plate.outer_clearance
end

# ╔═╡ 90fc9733-ab21-4fbf-9193-c594eda1c963
MY_DRAIN_PLATE = FloorDrainPlate(
	FloorDrainPlatePrototype(
		outer_diameter = 2.85u"inch",     # Diameter at the floor's surface
		lip_depth = 0.5u"inch",
		lip_length = 0.48u"inch"))

# ╔═╡ c328f0ac-95fa-40ef-a8fc-9cf2d37ab053
md"
## Drain Hole Profile
"

# ╔═╡ 697159f0-176c-4272-bd04-d8e004ac1caa
function drain_hole_profile(plate::FloorDrainPlate)
	io = IOBuffer()
	floor_margin = 1u"inch"
	y_margin = 0.25u"inch"
	drain_descent = 0.5u"inch"
	centerline_style = "fill: none; stroke: green; stroke-width: 0.01; stroke-dash-array: '10,10'"
	profile_style = "fill: none; stroke: black; stroke-width: 0.05"
	svg(io;
		xmlns=ShaperOriginDesignLib.SVG_NAMESPACE,
		viewport_attributes(
			- plate.outer_diameter - floor_margin,
			- y_margin,
			2 * (plate.outer_diameter + floor_margin),
			plate.lip_depth + drain_descent + 2 * y_margin,
			u"inch")...,
		style="background-color: pink") do
		g(io) do
			# center line
			path(io; d = pathd(
					["M", 0, - y_margin],
					["V", plate.lip_depth + drain_descent + 2 * y_margin]
					),
				style=centerline_style)
			path(io; d = pathd(
					["M", - plate.outer_diameter - floor_margin, y_margin],
					["h", floor_margin],
					["v", plate.lip_depth],
					["h", plate.lip_length],
					["v", drain_descent]),
				style=profile_style)
			path(io; d = pathd(
					["M", plate.outer_diameter + floor_margin, y_margin],
					["h", - floor_margin],
					["v", plate.lip_depth],
					["h", - plate.lip_length],
					["v", drain_descent]
					),
				style=profile_style)
		end
	end
	String(take!(io))
end

# ╔═╡ 838e0ac4-8f49-4074-b040-ab69efcb2250
HTML(drain_hole_profile(MY_DRAIN_PLATE))

# ╔═╡ 3d0672b8-b236-4cc6-ad26-db87dce336a7
md"""
## Plate Design
"""

# ╔═╡ c2149c11-962e-4e72-8ee6-9add50e56151
function drain_plate(plate::FloorDrainPlate)
	io = IOBuffer()
	svg_margin = 0.25u"inch"
	minX = - svg_margin - outer_radius(plate)
	maxX = - minX
	minY = minX
	maxY = - minY
	svg(io;
		xmlns=ShaperOriginDesignLib.SVG_NAMESPACE,
		viewport_attributes(minX, minY, maxX - minX, maxY - minY, u"inch")...,
		style="background-color: pink") do
		g(io) do
			custom_anchor(io, - outer_radius(plate), outer_radius(plate))
			# The perimeter of the plate
			circle(io; cx=0, cy=0,
				r=svgval(outer_radius(plate)),
				style=shaper_style_string(:outside_cut))
			circle(io; cx=0, cy=0,
				r=svgval(outer_radius(plate) - plate.lip_length),
				style=shaper_style_string(:guide_line))
			# a grid of drain holes
			function hole(x, y)
				circle(io; cx=svgval(x),
					cy=svgval(y),
					r=svgval(plate.drain_hole_diameter / 2),
					style=shaper_style_string(:inside_cut))
			end
			hole_range = 0u"inch" : plate.drain_hole_spacing : outer_radius(plate)
			g(io) do
				for x in hole_range
					for y in hole_range
						if x^2 + y^2 < plate.max_drain_hole_from_center ^ 2
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
			# Axes
			path(io;
				d=pathd(["M", 0, minY], ["V", maxY]),
				style=shaper_style_string(:guide_line))
			path(io;
				d=pathd(["M", minX, 0], ["H", maxX]),
				style=shaper_style_string(:guide_line))
		end
	end
	String(take!(io))
end

# ╔═╡ 414eecf3-7d9e-4da7-b5cf-122a1b260713
HTML(drain_plate(MY_DRAIN_PLATE))

# ╔═╡ b8252567-b6c0-4194-8d45-2c42cf80b9bc
@bind copy_button PlutoUI.Button("Copy SVG to Clipboard")

# ╔═╡ 44714b33-a6f7-4569-a2db-8c457b8cab28
begin
	copy_button
	dpsvg = drain_plate(MY_DRAIN_PLATE)
	try
		clipboard(dpsvg)
	catch e
		DisplayAs.Text(dpsvg)
	end
end

# ╔═╡ Cell order:
# ╠═0b6a9f58-d52e-4226-85a3-89ed73a41481
# ╟─4d4caff2-14aa-11ec-20fa-0d12a3b75e3b
# ╟─d92a58b3-374e-44c4-9b43-d020b39632d7
# ╠═6939c928-e375-4305-ba79-6724e5a3983f
# ╠═625eda88-04ea-4aab-829c-24c29552c1e7
# ╠═b6bf9e2f-f3cc-4ab5-b9e3-4efb16592c94
# ╠═03ca99d7-6fef-426c-a2fe-d65046f357fd
# ╠═90fc9733-ab21-4fbf-9193-c594eda1c963
# ╟─c328f0ac-95fa-40ef-a8fc-9cf2d37ab053
# ╠═697159f0-176c-4272-bd04-d8e004ac1caa
# ╟─838e0ac4-8f49-4074-b040-ab69efcb2250
# ╟─3d0672b8-b236-4cc6-ad26-db87dce336a7
# ╠═c2149c11-962e-4e72-8ee6-9add50e56151
# ╟─414eecf3-7d9e-4da7-b5cf-122a1b260713
# ╟─b8252567-b6c0-4194-8d45-2c42cf80b9bc
# ╟─44714b33-a6f7-4569-a2db-8c457b8cab28
