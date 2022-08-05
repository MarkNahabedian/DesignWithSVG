### A Pluto.jl notebook ###
# v0.17.7

using Markdown
using InteractiveUtils

# ╔═╡ 531d7860-1274-11ed-2e80-23b93e665413
begin
	using Unitful
	using UnitfulUS
	using NahaJuliaLib   # https://github.com/MarkNahabedian/NahaJuliaLib.jl
end

# ╔═╡ cbb54a89-b1cd-4ba7-8f31-d37c3b19c4e7
md"""
# A Box for my Veritas Setup Blocks
"""

# ╔═╡ 83030cdb-0cdc-4729-80b4-edc88943484a
"""
    Footprint

The `Footprint` of a `SetupBlock` encapsulates its length and width --
those measurements that are not the designates "size" of the block.

The `Footprint` is used to figure out how much area each setup block
will require in the storage box and how to arrage trhe blocks in the box.
"""
struct Footprint
	length
	width

	function Footprint(m1, m2)
		@assert unit(m1) == unit(m2)
		new(max(m1, m2), min(m1, m2))
	end
end

# ╔═╡ d94ba5b5-0409-4d56-915f-45ae321e71bb
begin
	HALF_SPACING = 1//16 * u"inch"
	FOOTPRINTS = [
		Footprint(2 * u"inch", 1//2 * u"inch"),
		Footprint(5 * u"mm", 1 * u"mm")
		]
end

# ╔═╡ e18ee07d-330d-4e39-8aff-401a311a285f
Unitful.unit(fp::Footprint) = unit(fp.length)

# ╔═╡ 68f45016-82ca-46c6-b445-da3ec106c462
"""
    SetupBlock

A `SetupBlock` represents a setup block.  A `SetupBlock`'s `gauge` is
the accurate measurement that the block is used to measure.
Its `length` and `width` are derived from its `footprint`.
"""
struct SetupBlock
	gauge
	footprint::Footprint

	function SetupBlock(gauge)
		footprint = first(filter(FOOTPRINTS) do fp
			unit(fp) == unit(gauge)
 		end)
		new(gauge, footprint)
	end
end

# ╔═╡ 507579d3-fd88-489d-9b2f-344c09793d00
Unitful.unit(b::SetupBlock) = unit(b.gauge)

# ╔═╡ 8f63535c-1595-463f-8400-0a4a507f4344
begin
	# Delegate length and width properties of SetupBlock to its Footprint

	@njl_getprop Footprint

	Base.getproperty(b::SetupBlock, prop::Val{:length}) = b.length
	Base.getproperty(b::SetupBlock, prop::Val{:width}) = b.width
end

# ╔═╡ 927e81b3-e492-46c1-bbf8-42551b1af72e
SETUP_BLOCKS = map(SetupBlock, Any[
	([1//16, 1//8, 1//4, 1//2, 3//4]
	* u"inch")...,
	([3//16, 5//16, 3//8, 7//16, 9//16, 5//8, 11//16]
	* u"inch")...,
	([1//32, 3//32, 5//32, 7//32, 15//32, 23//32]
	* u"inch")...,
	([0.5, 0.5, 1, 2, 4, 8, 16, 16]
	* u"mm")...
])

# ╔═╡ c04d0f6a-0d39-4bfe-890d-b1a36ec3aa8a
function for_units(units)
	filter(SETUP_BLOCKS) do 
		unit(b) == units
	end
end

# ╔═╡ c7fd5c57-091f-4bcf-83a3-9ec139d05a18
sort(SETUP_BLOCKS; by = x -> x.gauge)

# ╔═╡ 00000000-0000-0000-0000-000000000001
PLUTO_PROJECT_TOML_CONTENTS = """
[deps]
NahaJuliaLib = "9569be99-1faa-4e84-9751-444b87a7f9a0"
Unitful = "1986cc42-f94f-5a68-af5c-568840ba703d"
UnitfulUS = "7dc9378f-8956-57ef-a780-aa31cc70ff3d"

[compat]
Unitful = "~1.11.0"
UnitfulUS = "~0.2.0"
"""

# ╔═╡ 00000000-0000-0000-0000-000000000002
PLUTO_MANIFEST_TOML_CONTENTS = """
# This file is machine-generated - editing it directly is not advised

julia_version = "1.7.3"
manifest_format = "2.0"

[[deps.ArgTools]]
uuid = "0dad84c5-d112-42e6-8d28-ef12dabb789f"

[[deps.Artifacts]]
uuid = "56f22d72-fd6d-98f1-02f0-08ddc0907c33"

[[deps.Base64]]
uuid = "2a0f44e3-6c83-55bd-87e4-b1978d98bd5f"

[[deps.Compat]]
deps = ["Dates", "LinearAlgebra", "UUIDs"]
git-tree-sha1 = "924cdca592bc16f14d2f7006754a621735280b74"
uuid = "34da2185-b29b-5c13-b0c7-acf172513d20"
version = "4.1.0"

[[deps.CompilerSupportLibraries_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "e66e0078-7015-5450-92f7-15fbd957f2ae"

[[deps.ConstructionBase]]
deps = ["LinearAlgebra"]
git-tree-sha1 = "59d00b3139a9de4eb961057eabb65ac6522be954"
uuid = "187b0558-2788-49d3-abe0-74a17ed4e7c9"
version = "1.4.0"

[[deps.DataStructures]]
deps = ["Compat", "InteractiveUtils", "OrderedCollections"]
git-tree-sha1 = "d1fff3a548102f48987a52a2e0d114fa97d730f0"
uuid = "864edb3b-99cc-5e75-8d2d-829cb0a9cfe8"
version = "0.18.13"

[[deps.Dates]]
deps = ["Printf"]
uuid = "ade2ca70-3891-5945-98fb-dc099432e06a"

[[deps.Downloads]]
deps = ["ArgTools", "FileWatching", "LibCURL", "NetworkOptions"]
uuid = "f43a241f-c20a-4ad4-852c-f6b1247861c6"

[[deps.FileWatching]]
uuid = "7b1f6079-737a-58dc-b8bc-7a2ca5c1b5ee"

[[deps.HTTP]]
deps = ["Base64", "Dates", "IniFile", "Logging", "MbedTLS", "NetworkOptions", "Sockets", "URIs"]
git-tree-sha1 = "0fa77022fe4b511826b39c894c90daf5fce3334a"
uuid = "cd3eb016-35fb-5094-929b-558a96fad6f3"
version = "0.9.17"

[[deps.IniFile]]
git-tree-sha1 = "f550e6e32074c939295eb5ea6de31849ac2c9625"
uuid = "83e8ac13-25f8-5344-8a64-a9f2b223428f"
version = "0.5.1"

[[deps.InteractiveUtils]]
deps = ["Markdown"]
uuid = "b77e0a4c-d291-57a0-90e8-8db25a27a240"

[[deps.LibCURL]]
deps = ["LibCURL_jll", "MozillaCACerts_jll"]
uuid = "b27032c2-a3e7-50c8-80cd-2d36dbcbfd21"

[[deps.LibCURL_jll]]
deps = ["Artifacts", "LibSSH2_jll", "Libdl", "MbedTLS_jll", "Zlib_jll", "nghttp2_jll"]
uuid = "deac9b47-8bc7-5906-a0fe-35ac56dc84c0"

[[deps.LibGit2]]
deps = ["Base64", "NetworkOptions", "Printf", "SHA"]
uuid = "76f85450-5226-5b5a-8eaa-529ad045b433"

[[deps.LibSSH2_jll]]
deps = ["Artifacts", "Libdl", "MbedTLS_jll"]
uuid = "29816b5a-b9ab-546f-933c-edad1886dfa8"

[[deps.Libdl]]
uuid = "8f399da3-3557-5675-b5ff-fb832c97cbdb"

[[deps.LinearAlgebra]]
deps = ["Libdl", "libblastrampoline_jll"]
uuid = "37e2e46d-f89d-539d-b4ee-838fcccc9c8e"

[[deps.Logging]]
uuid = "56ddb016-857b-54e1-b83d-db4d58db5568"

[[deps.MacroTools]]
deps = ["Markdown", "Random"]
git-tree-sha1 = "3d3e902b31198a27340d0bf00d6ac452866021cf"
uuid = "1914dd2f-81c6-5fcd-8719-6d5c9610ff09"
version = "0.5.9"

[[deps.Markdown]]
deps = ["Base64"]
uuid = "d6f4376e-aef5-505a-96c1-9c027394607a"

[[deps.MbedTLS]]
deps = ["Dates", "MbedTLS_jll", "MozillaCACerts_jll", "Random", "Sockets"]
git-tree-sha1 = "d9ab10da9de748859a7780338e1d6566993d1f25"
uuid = "739be429-bea8-5141-9913-cc70e7f3736d"
version = "1.1.3"

[[deps.MbedTLS_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "c8ffd9c3-330d-5841-b78e-0817d7145fa1"

[[deps.MozillaCACerts_jll]]
uuid = "14a3606d-f60d-562e-9121-12d972cd8159"

[[deps.NahaJuliaLib]]
deps = ["DataStructures", "HTTP", "InteractiveUtils", "Logging", "MacroTools", "Pkg", "URIs", "VectorLogging"]
git-tree-sha1 = "6d364e774a8bdd76b83847ffd1b0a72adb7fc9b3"
repo-rev = "master"
repo-url = "https://github.com/MarkNahabedian/NahaJuliaLib.jl"
uuid = "9569be99-1faa-4e84-9751-444b87a7f9a0"
version = "0.1.0"

[[deps.NetworkOptions]]
uuid = "ca575930-c2e3-43a9-ace4-1e988b2c1908"

[[deps.OpenBLAS_jll]]
deps = ["Artifacts", "CompilerSupportLibraries_jll", "Libdl"]
uuid = "4536629a-c528-5b80-bd46-f80d51c5b363"

[[deps.OrderedCollections]]
git-tree-sha1 = "85f8e6578bf1f9ee0d11e7bb1b1456435479d47c"
uuid = "bac558e1-5e72-5ebc-8fee-abe8a469f55d"
version = "1.4.1"

[[deps.Pkg]]
deps = ["Artifacts", "Dates", "Downloads", "LibGit2", "Libdl", "Logging", "Markdown", "Printf", "REPL", "Random", "SHA", "Serialization", "TOML", "Tar", "UUIDs", "p7zip_jll"]
uuid = "44cfe95a-1eb2-52ea-b672-e2afdf69b78f"

[[deps.Printf]]
deps = ["Unicode"]
uuid = "de0858da-6303-5e67-8744-51eddeeeb8d7"

[[deps.REPL]]
deps = ["InteractiveUtils", "Markdown", "Sockets", "Unicode"]
uuid = "3fa0cd96-eef1-5676-8a61-b3b8758bbffb"

[[deps.Random]]
deps = ["SHA", "Serialization"]
uuid = "9a3f8284-a2c9-5f02-9a11-845980a1fd5c"

[[deps.SHA]]
uuid = "ea8e919c-243c-51af-8825-aaa63cd721ce"

[[deps.Serialization]]
uuid = "9e88b42a-f829-5b0c-bbe9-9e923198166b"

[[deps.Sockets]]
uuid = "6462fe0b-24de-5631-8697-dd941f90decc"

[[deps.TOML]]
deps = ["Dates"]
uuid = "fa267f1f-6049-4f14-aa54-33bafae1ed76"

[[deps.Tar]]
deps = ["ArgTools", "SHA"]
uuid = "a4e569a6-e804-4fa4-b0f3-eef7a1d5b13e"

[[deps.Test]]
deps = ["InteractiveUtils", "Logging", "Random", "Serialization"]
uuid = "8dfed614-e22c-5e08-85e1-65c5234f0b40"

[[deps.URIs]]
git-tree-sha1 = "e59ecc5a41b000fa94423a578d29290c7266fc10"
uuid = "5c2747f8-b7ea-4ff2-ba2e-563bfd36b1d4"
version = "1.4.0"

[[deps.UUIDs]]
deps = ["Random", "SHA"]
uuid = "cf7118a7-6976-5b1a-9a39-7adc72f591a4"

[[deps.Unicode]]
uuid = "4ec0a83e-493e-50e2-b9ac-8f72acf5a8f5"

[[deps.Unitful]]
deps = ["ConstructionBase", "Dates", "LinearAlgebra", "Random"]
git-tree-sha1 = "b649200e887a487468b71821e2644382699f1b0f"
uuid = "1986cc42-f94f-5a68-af5c-568840ba703d"
version = "1.11.0"

[[deps.UnitfulUS]]
deps = ["Unitful"]
git-tree-sha1 = "aa8a8a140729fbca8c8d960ab488e0bf6b87feed"
uuid = "7dc9378f-8956-57ef-a780-aa31cc70ff3d"
version = "0.2.0"

[[deps.VectorLogging]]
deps = ["Logging", "Test"]
git-tree-sha1 = "f4320fd358e078850d2ec23c799c61e32dc3d247"
uuid = "ec499083-3b8a-4310-a81e-8622934b14d2"
version = "0.1.0"

[[deps.Zlib_jll]]
deps = ["Libdl"]
uuid = "83775a58-1f1d-513f-b197-d71354ab007a"

[[deps.libblastrampoline_jll]]
deps = ["Artifacts", "Libdl", "OpenBLAS_jll"]
uuid = "8e850b90-86db-534c-a0d3-1478176c7d93"

[[deps.nghttp2_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "8e850ede-7688-5339-a07c-302acd2aaf8d"

[[deps.p7zip_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "3f19e933-33d8-53b3-aaab-bd5110c3b7a0"
"""

# ╔═╡ Cell order:
# ╟─cbb54a89-b1cd-4ba7-8f31-d37c3b19c4e7
# ╠═531d7860-1274-11ed-2e80-23b93e665413
# ╠═83030cdb-0cdc-4729-80b4-edc88943484a
# ╠═d94ba5b5-0409-4d56-915f-45ae321e71bb
# ╠═e18ee07d-330d-4e39-8aff-401a311a285f
# ╠═68f45016-82ca-46c6-b445-da3ec106c462
# ╠═507579d3-fd88-489d-9b2f-344c09793d00
# ╠═8f63535c-1595-463f-8400-0a4a507f4344
# ╠═927e81b3-e492-46c1-bbf8-42551b1af72e
# ╠═c04d0f6a-0d39-4bfe-890d-b1a36ec3aa8a
# ╠═c7fd5c57-091f-4bcf-83a3-9ec139d05a18
# ╟─00000000-0000-0000-0000-000000000001
# ╟─00000000-0000-0000-0000-000000000002
