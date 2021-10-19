### A Pluto.jl notebook ###
# v0.16.0

using Markdown
using InteractiveUtils

# ╔═╡ 59c58a2c-3fd0-4e4f-b532-ee50990ccfc6
begin
	using Pkg
	using Unitful
	using UnitfulUS
	using LinearAlgebra
	
	Pkg.add(; url="https://github.com/MarkNahabedian/ShaperOriginDesignLib")
	using ShaperOriginDesignLib
	
	Pkg.add(; url="https://github.com/MarkNahabedian/NativeSVG.jl")
	using NativeSVG

	Pkg.add("SymPy")
	using SymPy
end

# ╔═╡ 45308dc5-b4a5-4620-a19c-f6a309730234
function output_as_string(f)
	io = IOBuffer()
	f(io)
	String(take!(io))
end

# ╔═╡ a91eb1d7-4ae8-4d26-90d8-4845eda99421
function make_fit(f, io::IO)
	element(:div, io) do
		element(:div, io; style="width: 95%") do
			f(io)
		end
	end
end

# ╔═╡ 512508e0-3019-11ec-0583-314c21a05445
md"""
# Storage Box for End Stub Check Registers
"""

# ╔═╡ 3548e570-4b70-49f2-ae4e-8ab8d8a53413
md"""
## Dimensions of the Check Register Booklets
"""

# ╔═╡ dd8a7092-72a0-45b0-acb0-f4fbad4f2b69
@Base.kwdef struct CheckRegisterGeometry
	length_of_spine::Unitful.Length = (2 + 7/8)u"inch"
	width::Unitful.Length = (2 + 3/16)u"inch"
	width_excluding_binding::Unitful.Length = (1 + 3/4)u"inch"
end

# ╔═╡ ed7f20aa-0e34-4ad5-8e0d-097811b4a0e2
md"""
## Compartment Orientation
"""

# ╔═╡ 76e2ffaf-95ab-4feb-9aaa-3f104964cff6
abstract type CompartmentGeometry end

# ╔═╡ 3482232f-e597-4a9f-8be4-cadc390c6b70
struct HorizontalCompartmentsGeometry <: CompartmentGeometry
	crg::CheckRegisterGeometry
end

# ╔═╡ 3cad31c8-858d-4808-aab3-b77c8d8f59a5
# The dimension that's in the same direction as
# the long dimension of the whole box:
lengthwise(g::HorizontalCompartmentsGeometry) = g.crg.length_of_spine

# ╔═╡ 2e95b2ac-913d-48b8-bb92-3dec8eb7fc2b
# The dimension that's in the same direction as
# the short dimension of the box:
# The goal here is to not allow a register to
# lie flat in the bottom of the compartment.
widthwise(g::HorizontalCompartmentsGeometry) = g.crg.width_excluding_binding

# ╔═╡ c36e5aab-1b6b-46da-8dbf-01b8c5ca6f43
md"""
## Box Geometry
"""

# ╔═╡ 0ad848e6-45b8-492f-8fca-e5635167f366
@Base.kwdef struct BoxGeometry
	cutter_diameter = (1/8)u"inch"
	stock_thickness::Unitful.Length = (1/8)u"inch"
	drawer_width::Unitful.Length = 12.75u"inch"
	compartment_geometry::CompartmentGeometry
	rabbet_depth_factor = 0.5
end

# ╔═╡ 9c835149-77b5-443a-bc03-f41e4e54b471
rabbet_dfepth(g::BoxGeometry) = g.rabbet_depth_factor * g.stock_thickness

# ╔═╡ c038d6d8-b2d1-42be-97db-7fa1f940ac26
# Total length for a specified number of compartments:
function total_length(g::BoxGeometry, compartment_count)
	# SymPy doesn't play well with Unitful so we need to strip the units:
	compartment_length, stock_thickness = svgval.((
		lengthwise(g.compartment_geometry), g.stock_thickness))
	# We can't add the units back yet because this function's result
	# could be used in further SymPy expressiomns.
	return (compartment_count * compartment_length +
		(compartment_count + 1) * stock_thickness)
end

# ╔═╡ bb4aaed7-a5df-4a92-82f7-011c992124f4
function compartment_count(g::BoxGeometry)
	@syms cc
	convert(Int,
		floor(convert(Real,
			real_roots(svgval(g.drawer_width) -
					total_length(g, cc))[1])))
end

# ╔═╡ 7d4a8a48-11bc-4931-a6c3-998d6d1ad486
function box_length(g::BoxGeometry)
	total_length(g, compartment_count(g))u"inch"
end

# ╔═╡ 762713fb-e9df-4478-95c1-e5e5edd52015
function box_width(g::BoxGeometry)
	2 * g.stock_thickness + widthwise(g.compartment_geometry)
end

# ╔═╡ 56a1f727-0962-487c-bf13-4d6fd1548ded
# index=0 for the leftmost end of the box
function divider_position(g::BoxGeometry, index::Int) # ::(Unitful.Length, Unitful.Length)
	step = (box_length(g) - g.stock_thickness) / compartment_count(g)
	start = index * step
	return start, start + g.stock_thickness
end

# ╔═╡ e892efcd-a828-498e-8031-b250c6ba08e3
SVG_MARGIN = 0.25u"inch"

# ╔═╡ d63d7dbc-70c4-4d6d-900d-f88a7dbf3ff5
function baseSVG(io::IO, bg::BoxGeometry)
	@assert bg.cutter_diameter <= bg.stock_thickness
	svg(io;
		xmlns=SVG_NAMESPACE,
		viewport_attributes(- SVG_MARGIN, - SVG_MARGIN,
			box_length(bg) + SVG_MARGIN,
			box_width(bg) + SVG_MARGIN,
			u"inch")...,
		style="background-color: pink") do
		g(io) do
			rect(io;
				x = 0, y = 0,
				width = svgval(box_length(bg)),
				height = svgval(box_width(bg)),
				style = shaper_style_string(:outside_cut))
			function groove(x1, y1, x2, y2)
				# x1, y1, x2, y2 are the centerline of the groove.
				p1 = [x1, y1]
				p2 = [x2, y2]
				v = p2 - p1
				v = v / norm(v)
				sideways = (bg.cutter_diameter / 2) * [ - v[2], v[1] ]
				end1 = p1 - v * bg.cutter_diameter
				end2 = p2 + v * bg.cutter_diameter
				path(io;
					d = pathd(
						["M", (end1 - sideways)...],
						["L", (end2 - sideways)...],
						["L", (end2 + sideways)...],
						["L", (end1 + sideways)...],
						["z"]),
					style = shaper_style_string(:pocket_cut))
			end
			println(io, "<!-- Rabbets for the sides -->")
			for y in (bg.stock_thickness/2,
					box_width(bg) - bg.stock_thickness/2)
				groove(0u"inch", y, box_length(bg), y)
			end
			println(io, "<!-- Rabbets for the ends and dividers -->")
			for i in 0:compartment_count(bg)
				x1, x2 = divider_position(bg, i)
				@assert x2 - x1 == bg.cutter_diameter
				x = (x1 + x2) / 2
				groove(x, 0u"inch", x, box_width(bg))
			end
		end
	end
end

# ╔═╡ caa9be76-2771-40a0-9f1f-2256fb77b2e2
md"""
## Our Box
"""

# ╔═╡ 5b450389-412a-4be6-91b0-834ea406b74b
boxGeo = BoxGeometry(compartment_geometry=HorizontalCompartmentsGeometry(CheckRegisterGeometry()))

# ╔═╡ 76876d1c-9107-483c-bb6f-54c0feb11f02
HTML("""<p>
Box will have $(compartment_count(boxGeo)) compartments that are $(lengthwise(boxGeo.compartment_geometry)) long gives a total length of $(box_length(boxGeo)).
</p>""")

# ╔═╡ a0a9cbbe-7fd5-430d-9fa1-8b3d5cf6652f
(output_as_string() do io
		make_fit(io) do io
			baseSVG(io, boxGeo)
		end
	end)

# ╔═╡ Cell order:
# ╠═59c58a2c-3fd0-4e4f-b532-ee50990ccfc6
# ╠═45308dc5-b4a5-4620-a19c-f6a309730234
# ╠═a91eb1d7-4ae8-4d26-90d8-4845eda99421
# ╟─512508e0-3019-11ec-0583-314c21a05445
# ╟─3548e570-4b70-49f2-ae4e-8ab8d8a53413
# ╠═dd8a7092-72a0-45b0-acb0-f4fbad4f2b69
# ╟─ed7f20aa-0e34-4ad5-8e0d-097811b4a0e2
# ╠═76e2ffaf-95ab-4feb-9aaa-3f104964cff6
# ╠═3482232f-e597-4a9f-8be4-cadc390c6b70
# ╠═3cad31c8-858d-4808-aab3-b77c8d8f59a5
# ╠═2e95b2ac-913d-48b8-bb92-3dec8eb7fc2b
# ╟─c36e5aab-1b6b-46da-8dbf-01b8c5ca6f43
# ╠═0ad848e6-45b8-492f-8fca-e5635167f366
# ╠═9c835149-77b5-443a-bc03-f41e4e54b471
# ╠═c038d6d8-b2d1-42be-97db-7fa1f940ac26
# ╠═bb4aaed7-a5df-4a92-82f7-011c992124f4
# ╠═7d4a8a48-11bc-4931-a6c3-998d6d1ad486
# ╠═762713fb-e9df-4478-95c1-e5e5edd52015
# ╠═56a1f727-0962-487c-bf13-4d6fd1548ded
# ╠═e892efcd-a828-498e-8031-b250c6ba08e3
# ╠═d63d7dbc-70c4-4d6d-900d-f88a7dbf3ff5
# ╟─caa9be76-2771-40a0-9f1f-2256fb77b2e2
# ╠═5b450389-412a-4be6-91b0-834ea406b74b
# ╟─76876d1c-9107-483c-bb6f-54c0feb11f02
# ╠═a0a9cbbe-7fd5-430d-9fa1-8b3d5cf6652f
