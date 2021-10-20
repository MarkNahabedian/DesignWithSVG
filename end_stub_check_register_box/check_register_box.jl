### A Pluto.jl notebook ###
# v0.16.3

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

# ╔═╡ 59c58a2c-3fd0-4e4f-b532-ee50990ccfc6
begin
	using Pkg
	using Unitful
	using UnitfulUS
	using LinearAlgebra
	using PlutoUI
	
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

# ╔═╡ 9946c623-e100-435d-bbfd-ab3ae150aba3


# ╔═╡ ed7f20aa-0e34-4ad5-8e0d-097811b4a0e2
md"""
## Compartment Orientation
"""

# ╔═╡ 76e2ffaf-95ab-4feb-9aaa-3f104964cff6
abstract type CompartmentGeometry end

# ╔═╡ 14422643-a262-4cf1-afad-4d0da3302b32
md"""
### Horizontal

`HorizontalCompartmentsGeometry` arranges the compartments side by side such
that the spines of the registers line up acrossall of the compartments.
"""

# ╔═╡ 3482232f-e597-4a9f-8be4-cadc390c6b70
@Base.kwdef mutable struct HorizontalCompartmentsGeometry <: CompartmentGeometry
	crg::CheckRegisterGeometry
	extra_width::Unitful.Length = 0u"inch"
end

# ╔═╡ 3cad31c8-858d-4808-aab3-b77c8d8f59a5
# The dimension that's in the same direction as
# the long dimension of the whole box:
function compartment_lengthwise(g::HorizontalCompartmentsGeometry)
	g.crg.length_of_spine + g.extra_width
end

# ╔═╡ 2e95b2ac-913d-48b8-bb92-3dec8eb7fc2b
# The dimension that's in the same direction as
# the short dimension of the box:
# The goal here is to not allow a register to
# lie flat in the bottom of the compartment.
function compartment_widthwise(g::HorizontalCompartmentsGeometry)
	g.crg.width_excluding_binding
end

# ╔═╡ 98895c37-324b-417b-b359-18d340f55e94
md"""
### Vertical

I've not yet bothered to implement this.
"""

# ╔═╡ c36e5aab-1b6b-46da-8dbf-01b8c5ca6f43
md"""
## Box Geometry
"""

# ╔═╡ 0ad848e6-45b8-492f-8fca-e5635167f366
@Base.kwdef struct BoxGeometry
	cutter_diameter = (1/8)u"inch"
	stock_thickness::Unitful.Length = (1/8)u"inch"
	drawer_width::Unitful.Length = 12.5u"inch"   # actual measurement: 12.75u"inch"
	compartment_geometry::CompartmentGeometry
	rabbet_depth_factor = 0.5
end

# ╔═╡ 9c835149-77b5-443a-bc03-f41e4e54b471
rabbet_depth(g::BoxGeometry) = g.rabbet_depth_factor * g.stock_thickness

# ╔═╡ 184a19e5-cf44-463d-bb64-0392336d928b
function compartment_lengthwise(bg::BoxGeometry)
	compartment_lengthwise(bg.compartment_geometry)
end

# ╔═╡ ac86e669-8b80-444b-a003-920bc3e6d50b
function compartment_widthwise(bg::BoxGeometry)
	compartment_widthwise(bg.compartment_geometry)
end

# ╔═╡ c038d6d8-b2d1-42be-97db-7fa1f940ac26
# Total length for a specified number of compartments:
function total_length(g::BoxGeometry, compartment_count)
	# SymPy doesn't play well with Unitful so we need to strip the units:
	compartment_length, stock_thickness = svgval.((
		compartment_lengthwise(g), g.stock_thickness))
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
	2 * g.stock_thickness + compartment_widthwise(g)
end

# ╔═╡ ef63b1c0-65c9-46e3-8eb8-512949ccd0a6
function box_height(g::BoxGeometry)
	g.stock_thickness + g.compartment_geometry.crg.width_excluding_binding
end

# ╔═╡ 1ae09f82-5049-4977-9678-876c70eb0f75
# If there's room in the drawer, expand the extra_width of the compartment_lengthwise
# if the CompartmentGeometry allows it.
function expand_to_fit_drawer(bg::BoxGeometry)
	if !isa(bg.compartment_geometry, HorizontalCompartmentsGeometry)
		return bg
	end
	bg.compartment_geometry.extra_width += 
		(bg.drawer_width - box_length(bg)) / compartment_count(bg)
	return bg
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

# ╔═╡ 36b622a0-60cd-425c-b5aa-dfad099937fc
function groove(io::IO, bg::BoxGeometry, x1, y1, x2, y2)
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
			println(io, "<!-- Rabbets for the sides -->")
			for y in (bg.stock_thickness/2,
					box_width(bg) - bg.stock_thickness/2)
				groove(io, bg, 0u"inch", y, box_length(bg), y)
			end
			println(io, "<!-- Rabbets for the ends and dividers -->")
			for i in 0:compartment_count(bg)
				x1, x2 = divider_position(bg, i)
				@assert x2 - x1 == bg.cutter_diameter
				x = (x1 + x2) / 2
				groove(io, bg, x, 0u"inch", x, box_width(bg))
			end
		end
	end
end

# ╔═╡ 2df96c00-be88-405b-86f3-26fad869c9a2
function sideSVG(io::IO, bg::BoxGeometry)
	@assert bg.cutter_diameter <= bg.stock_thickness
	svg(io;
		xmlns=SVG_NAMESPACE,
		viewport_attributes(- SVG_MARGIN, - SVG_MARGIN,
			box_length(bg) + SVG_MARGIN,
			box_height(bg) + SVG_MARGIN,
			u"inch")...,
		style="background-color: pink") do
		g(io) do
			rect(io;
				x = 0, y = 0,
				width = svgval(box_length(bg)),
				height = svgval(box_height(bg)),
				style = shaper_style_string(:outside_cut))
			println(io, "<!-- Rabbets for the ends and dividers -->")
			for i in 0:compartment_count(bg)
				x1, x2 = divider_position(bg, i)
				@assert x2 - x1 == bg.cutter_diameter
				x = (x1 + x2) / 2
				groove(io, bg, x, 0u"inch", x, box_width(bg))
			end
		end
	end
end

# ╔═╡ caa9be76-2771-40a0-9f1f-2256fb77b2e2
md"""
## Our Box
"""

# ╔═╡ 5b450389-412a-4be6-91b0-834ea406b74b
boxGeo = expand_to_fit_drawer(
	BoxGeometry(compartment_geometry=HorizontalCompartmentsGeometry(
		crg = CheckRegisterGeometry())))

# ╔═╡ 76876d1c-9107-483c-bb6f-54c0feb11f02
HTML("""<p>
Box will have $(compartment_count(boxGeo)) compartments that are $(compartment_lengthwise(boxGeo)) long gives a total length of $(box_length(boxGeo)).
</p>""")

# ╔═╡ ffb0ea1e-e049-40b6-a6a3-eb7afc85fcfb
md"""
### Bottom

The base is cut to $(box_length(boxGeo)) by $(box_width(boxGeo)).
"""

# ╔═╡ a0a9cbbe-7fd5-430d-9fa1-8b3d5cf6652f
HTML(output_as_string() do io
		make_fit(io) do io
			baseSVG(io, boxGeo)
		end
	end)

# ╔═╡ 126f195f-c427-4028-8bad-f319f37ea23e
let
	@bind button PlutoUI.Button("Copy SVG to Clipboard")
	doc = output_as_string() do io
		baseSVG(io, boxGeo)
	end
	try
		clipboard(doc)
	catch e
		DisplayAs.Text(doc)
	end
end

# ╔═╡ 69a30bc7-343f-4a16-a20e-509d507c6d98
md"""
### Sides


The base is cut to $(box_length(boxGeo)) by $(box_height(boxGeo)).
"""

# ╔═╡ 1e656eaf-e437-4aa4-b9c4-41b7880101ef
HTML(output_as_string() do io
		make_fit(io) do io
			sideSVG(io, boxGeo)
		end
	end)

# ╔═╡ 2445f26e-8b52-4ae0-8cc9-dbe9dc04bbed
let
	button = PlutoUI.Button("Copy SVG to Clipboard")
	doc = output_as_string() do io
		sideSVG(io, boxGeo)
	end
	try
		clipboard(doc)
	catch e
		DisplayAs.Text(doc)
	end
end

# ╔═╡ Cell order:
# ╠═59c58a2c-3fd0-4e4f-b532-ee50990ccfc6
# ╠═45308dc5-b4a5-4620-a19c-f6a309730234
# ╠═a91eb1d7-4ae8-4d26-90d8-4845eda99421
# ╟─512508e0-3019-11ec-0583-314c21a05445
# ╟─3548e570-4b70-49f2-ae4e-8ab8d8a53413
# ╠═dd8a7092-72a0-45b0-acb0-f4fbad4f2b69
# ╠═9946c623-e100-435d-bbfd-ab3ae150aba3
# ╠═ed7f20aa-0e34-4ad5-8e0d-097811b4a0e2
# ╠═76e2ffaf-95ab-4feb-9aaa-3f104964cff6
# ╟─14422643-a262-4cf1-afad-4d0da3302b32
# ╠═3482232f-e597-4a9f-8be4-cadc390c6b70
# ╠═3cad31c8-858d-4808-aab3-b77c8d8f59a5
# ╠═2e95b2ac-913d-48b8-bb92-3dec8eb7fc2b
# ╟─98895c37-324b-417b-b359-18d340f55e94
# ╟─c36e5aab-1b6b-46da-8dbf-01b8c5ca6f43
# ╠═0ad848e6-45b8-492f-8fca-e5635167f366
# ╠═9c835149-77b5-443a-bc03-f41e4e54b471
# ╠═184a19e5-cf44-463d-bb64-0392336d928b
# ╠═ac86e669-8b80-444b-a003-920bc3e6d50b
# ╠═c038d6d8-b2d1-42be-97db-7fa1f940ac26
# ╠═bb4aaed7-a5df-4a92-82f7-011c992124f4
# ╠═7d4a8a48-11bc-4931-a6c3-998d6d1ad486
# ╠═762713fb-e9df-4478-95c1-e5e5edd52015
# ╠═ef63b1c0-65c9-46e3-8eb8-512949ccd0a6
# ╠═1ae09f82-5049-4977-9678-876c70eb0f75
# ╠═56a1f727-0962-487c-bf13-4d6fd1548ded
# ╠═e892efcd-a828-498e-8031-b250c6ba08e3
# ╠═36b622a0-60cd-425c-b5aa-dfad099937fc
# ╠═d63d7dbc-70c4-4d6d-900d-f88a7dbf3ff5
# ╠═2df96c00-be88-405b-86f3-26fad869c9a2
# ╟─caa9be76-2771-40a0-9f1f-2256fb77b2e2
# ╠═5b450389-412a-4be6-91b0-834ea406b74b
# ╟─76876d1c-9107-483c-bb6f-54c0feb11f02
# ╟─ffb0ea1e-e049-40b6-a6a3-eb7afc85fcfb
# ╠═a0a9cbbe-7fd5-430d-9fa1-8b3d5cf6652f
# ╠═126f195f-c427-4028-8bad-f319f37ea23e
# ╟─69a30bc7-343f-4a16-a20e-509d507c6d98
# ╠═1e656eaf-e437-4aa4-b9c4-41b7880101ef
# ╠═2445f26e-8b52-4ae0-8cc9-dbe9dc04bbed
