### A Pluto.jl notebook ###
# v0.17.4

using Markdown
using InteractiveUtils

# This Pluto notebook uses @bind for interactivity. When running this notebook outside of Pluto, the following 'mock version' of @bind gives bound variables a default value (instead of an error).
macro bind(def, element)
    quote
        local iv = try Base.loaded_modules[Base.PkgId(Base.UUID("6e696c72-6542-2067-7265-42206c756150"), "AbstractPlutoDingetjes")].Bonds.initial_value catch; b -> missing; end
        local el = $(esc(element))
        global $(esc(def)) = Core.applicable(Base.get, el) ? Base.get(el) : iv(el)
        el
    end
end

# ╔═╡ 0b6a9f58-d52e-4226-85a3-89ed73a41481
begin
	# Sorry - It takes several minutes to process the dependencies

	using NativeSVG
	using ShaperOriginDesignLib
	using Unitful
	using UnitfulUS
	using PlutoUI
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
		xmlns=SVG_NAMESPACE,
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
		xmlns=SVG_NAMESPACE,
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

# ╔═╡ 00000000-0000-0000-0000-000000000001
PLUTO_PROJECT_TOML_CONTENTS = """
[deps]
DisplayAs = "0b91fe84-8a4c-11e9-3e1d-67c38462b6d6"
NativeSVG = "5f95e7b2-fe07-4078-b4a7-f744f426795c"
PlutoUI = "7f904dfe-b85e-4ff6-b463-dae2292396a8"
ShaperOriginDesignLib = "919415d1-862b-4149-89fa-1b0f92b0b06b"
Unitful = "1986cc42-f94f-5a68-af5c-568840ba703d"
UnitfulUS = "7dc9378f-8956-57ef-a780-aa31cc70ff3d"
"""

# ╔═╡ 00000000-0000-0000-0000-000000000002
PLUTO_MANIFEST_TOML_CONTENTS = """
# This file is machine-generated - editing it directly is not advised

[[AbstractPlutoDingetjes]]
deps = ["Pkg"]
git-tree-sha1 = "8eaf9f1b4921132a4cff3f36a1d9ba923b14a481"
uuid = "6e696c72-6542-2067-7265-42206c756150"
version = "1.1.4"

[[ArgTools]]
uuid = "0dad84c5-d112-42e6-8d28-ef12dabb789f"

[[Artifacts]]
uuid = "56f22d72-fd6d-98f1-02f0-08ddc0907c33"

[[Base64]]
uuid = "2a0f44e3-6c83-55bd-87e4-b1978d98bd5f"

[[ColorTypes]]
deps = ["FixedPointNumbers", "Random"]
git-tree-sha1 = "024fe24d83e4a5bf5fc80501a314ce0d1aa35597"
uuid = "3da002f7-5984-5a60-b8a6-cbb66c0b333f"
version = "0.11.0"

[[Compat]]
deps = ["Base64", "Dates", "DelimitedFiles", "Distributed", "InteractiveUtils", "LibGit2", "Libdl", "LinearAlgebra", "Markdown", "Mmap", "Pkg", "Printf", "REPL", "Random", "SHA", "Serialization", "SharedArrays", "Sockets", "SparseArrays", "Statistics", "Test", "UUIDs", "Unicode"]
git-tree-sha1 = "44c37b4636bc54afac5c574d2d02b625349d6582"
uuid = "34da2185-b29b-5c13-b0c7-acf172513d20"
version = "3.41.0"

[[ConstructionBase]]
deps = ["LinearAlgebra"]
git-tree-sha1 = "f74e9d5388b8620b4cee35d4c5a618dd4dc547f4"
uuid = "187b0558-2788-49d3-abe0-74a17ed4e7c9"
version = "1.3.0"

[[DataStructures]]
deps = ["Compat", "InteractiveUtils", "OrderedCollections"]
git-tree-sha1 = "3daef5523dd2e769dad2365274f760ff5f282c7d"
uuid = "864edb3b-99cc-5e75-8d2d-829cb0a9cfe8"
version = "0.18.11"

[[Dates]]
deps = ["Printf"]
uuid = "ade2ca70-3891-5945-98fb-dc099432e06a"

[[DelimitedFiles]]
deps = ["Mmap"]
uuid = "8bb1440f-4735-579b-a4ab-409b98df4dab"

[[DisplayAs]]
git-tree-sha1 = "44e8d47bc0b56ec09115056a692e5fa0976bfbff"
uuid = "0b91fe84-8a4c-11e9-3e1d-67c38462b6d6"
version = "0.1.2"

[[Distributed]]
deps = ["Random", "Serialization", "Sockets"]
uuid = "8ba89e20-285c-5b6f-9357-94700520ee1b"

[[Downloads]]
deps = ["ArgTools", "LibCURL", "NetworkOptions"]
uuid = "f43a241f-c20a-4ad4-852c-f6b1247861c6"

[[FixedPointNumbers]]
deps = ["Statistics"]
git-tree-sha1 = "335bfdceacc84c5cdf16aadc768aa5ddfc5383cc"
uuid = "53c48c17-4a7d-5ca2-90c5-79b7896eea93"
version = "0.8.4"

[[Hyperscript]]
deps = ["Test"]
git-tree-sha1 = "8d511d5b81240fc8e6802386302675bdf47737b9"
uuid = "47d2ed2b-36de-50cf-bf87-49c2cf4b8b91"
version = "0.0.4"

[[HypertextLiteral]]
git-tree-sha1 = "2b078b5a615c6c0396c77810d92ee8c6f470d238"
uuid = "ac1192a8-f4b3-4bfe-ba22-af5b92cd3ab2"
version = "0.9.3"

[[IOCapture]]
deps = ["Logging", "Random"]
git-tree-sha1 = "f7be53659ab06ddc986428d3a9dcc95f6fa6705a"
uuid = "b5f81e59-6552-4d32-b1f0-c071b021bf89"
version = "0.2.2"

[[InteractiveUtils]]
deps = ["Markdown"]
uuid = "b77e0a4c-d291-57a0-90e8-8db25a27a240"

[[JSON]]
deps = ["Dates", "Mmap", "Parsers", "Unicode"]
git-tree-sha1 = "8076680b162ada2a031f707ac7b4953e30667a37"
uuid = "682c06a0-de6a-54ab-a142-c8b1cf79cde6"
version = "0.21.2"

[[LibCURL]]
deps = ["LibCURL_jll", "MozillaCACerts_jll"]
uuid = "b27032c2-a3e7-50c8-80cd-2d36dbcbfd21"

[[LibCURL_jll]]
deps = ["Artifacts", "LibSSH2_jll", "Libdl", "MbedTLS_jll", "Zlib_jll", "nghttp2_jll"]
uuid = "deac9b47-8bc7-5906-a0fe-35ac56dc84c0"

[[LibGit2]]
deps = ["Base64", "NetworkOptions", "Printf", "SHA"]
uuid = "76f85450-5226-5b5a-8eaa-529ad045b433"

[[LibSSH2_jll]]
deps = ["Artifacts", "Libdl", "MbedTLS_jll"]
uuid = "29816b5a-b9ab-546f-933c-edad1886dfa8"

[[Libdl]]
uuid = "8f399da3-3557-5675-b5ff-fb832c97cbdb"

[[LinearAlgebra]]
deps = ["Libdl"]
uuid = "37e2e46d-f89d-539d-b4ee-838fcccc9c8e"

[[Logging]]
uuid = "56ddb016-857b-54e1-b83d-db4d58db5568"

[[Markdown]]
deps = ["Base64"]
uuid = "d6f4376e-aef5-505a-96c1-9c027394607a"

[[MbedTLS_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "c8ffd9c3-330d-5841-b78e-0817d7145fa1"

[[Mmap]]
uuid = "a63ad114-7e13-5084-954f-fe012c677804"

[[MozillaCACerts_jll]]
uuid = "14a3606d-f60d-562e-9121-12d972cd8159"

[[NativeSVG]]
deps = ["NodeJS"]
git-tree-sha1 = "25cfd8cdd020ea0f609d6016df9c479541f78f7e"
repo-rev = "master"
repo-url = "https://github.com/MarkNahabedian/NativeSVG.jl.git"
uuid = "5f95e7b2-fe07-4078-b4a7-f744f426795c"
version = "0.1.0-naha"

[[NetworkOptions]]
uuid = "ca575930-c2e3-43a9-ace4-1e988b2c1908"

[[NodeJS]]
deps = ["Pkg"]
git-tree-sha1 = "905224bbdd4b555c69bb964514cfa387616f0d3a"
uuid = "2bd173c7-0d6d-553b-b6af-13a54713934c"
version = "1.3.0"

[[OrderedCollections]]
git-tree-sha1 = "85f8e6578bf1f9ee0d11e7bb1b1456435479d47c"
uuid = "bac558e1-5e72-5ebc-8fee-abe8a469f55d"
version = "1.4.1"

[[Parsers]]
deps = ["Dates"]
git-tree-sha1 = "d7fa6237da8004be601e19bd6666083056649918"
uuid = "69de0a69-1ddd-5017-9359-2bf0b02dc9f0"
version = "2.1.3"

[[Pkg]]
deps = ["Artifacts", "Dates", "Downloads", "LibGit2", "Libdl", "Logging", "Markdown", "Printf", "REPL", "Random", "SHA", "Serialization", "TOML", "Tar", "UUIDs", "p7zip_jll"]
uuid = "44cfe95a-1eb2-52ea-b672-e2afdf69b78f"

[[PlutoUI]]
deps = ["AbstractPlutoDingetjes", "Base64", "ColorTypes", "Dates", "Hyperscript", "HypertextLiteral", "IOCapture", "InteractiveUtils", "JSON", "Logging", "Markdown", "Random", "Reexport", "UUIDs"]
git-tree-sha1 = "fed057115644d04fba7f4d768faeeeff6ad11a60"
uuid = "7f904dfe-b85e-4ff6-b463-dae2292396a8"
version = "0.7.27"

[[Printf]]
deps = ["Unicode"]
uuid = "de0858da-6303-5e67-8744-51eddeeeb8d7"

[[REPL]]
deps = ["InteractiveUtils", "Markdown", "Sockets", "Unicode"]
uuid = "3fa0cd96-eef1-5676-8a61-b3b8758bbffb"

[[Random]]
deps = ["Serialization"]
uuid = "9a3f8284-a2c9-5f02-9a11-845980a1fd5c"

[[Reexport]]
git-tree-sha1 = "45e428421666073eab6f2da5c9d310d99bb12f9b"
uuid = "189a3867-3050-52da-a836-e630ba90ab69"
version = "1.2.2"

[[SHA]]
uuid = "ea8e919c-243c-51af-8825-aaa63cd721ce"

[[Serialization]]
uuid = "9e88b42a-f829-5b0c-bbe9-9e923198166b"

[[ShaperOriginDesignLib]]
deps = ["DataStructures", "NativeSVG", "Printf", "Unitful", "UnitfulUS"]
git-tree-sha1 = "37eeaba5711ebe1e3b39c713a1250c1fcf45fedc"
repo-rev = "master"
repo-url = "https://github.com/MarkNahabedian/ShaperOriginDesignLib.git"
uuid = "919415d1-862b-4149-89fa-1b0f92b0b06b"
version = "0.2.0"

[[SharedArrays]]
deps = ["Distributed", "Mmap", "Random", "Serialization"]
uuid = "1a1011a3-84de-559e-8e89-a11a2f7dc383"

[[Sockets]]
uuid = "6462fe0b-24de-5631-8697-dd941f90decc"

[[SparseArrays]]
deps = ["LinearAlgebra", "Random"]
uuid = "2f01184e-e22b-5df5-ae63-d93ebab69eaf"

[[Statistics]]
deps = ["LinearAlgebra", "SparseArrays"]
uuid = "10745b16-79ce-11e8-11f9-7d13ad32a3b2"

[[TOML]]
deps = ["Dates"]
uuid = "fa267f1f-6049-4f14-aa54-33bafae1ed76"

[[Tar]]
deps = ["ArgTools", "SHA"]
uuid = "a4e569a6-e804-4fa4-b0f3-eef7a1d5b13e"

[[Test]]
deps = ["InteractiveUtils", "Logging", "Random", "Serialization"]
uuid = "8dfed614-e22c-5e08-85e1-65c5234f0b40"

[[UUIDs]]
deps = ["Random", "SHA"]
uuid = "cf7118a7-6976-5b1a-9a39-7adc72f591a4"

[[Unicode]]
uuid = "4ec0a83e-493e-50e2-b9ac-8f72acf5a8f5"

[[Unitful]]
deps = ["ConstructionBase", "Dates", "LinearAlgebra", "Random"]
git-tree-sha1 = "09b3c3eb6767521346b3716e461ddfb3ebe88293"
uuid = "1986cc42-f94f-5a68-af5c-568840ba703d"
version = "1.10.0"

[[UnitfulUS]]
deps = ["Unitful"]
git-tree-sha1 = "aa8a8a140729fbca8c8d960ab488e0bf6b87feed"
uuid = "7dc9378f-8956-57ef-a780-aa31cc70ff3d"
version = "0.2.0"

[[Zlib_jll]]
deps = ["Libdl"]
uuid = "83775a58-1f1d-513f-b197-d71354ab007a"

[[nghttp2_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "8e850ede-7688-5339-a07c-302acd2aaf8d"

[[p7zip_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "3f19e933-33d8-53b3-aaab-bd5110c3b7a0"
"""

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
# ╟─00000000-0000-0000-0000-000000000001
# ╟─00000000-0000-0000-0000-000000000002
