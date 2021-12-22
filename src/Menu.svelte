<script>
    import { MusicPiece } from "../node_modules/musicvis-lib/dist/musicvislib";
    import * as d3 from "d3";
    import JSZip from "jszip";
    import { createEventDispatcher } from "svelte";
    import Select, { Option } from "@smui/select";

    const dispatch = createEventDispatcher();
    const submitFile = (musicxml, musicpiece) =>
        dispatch("fileopened", { musicxml, musicpiece });

    export let musicxml = null;
    export let musicpiece = null;
    export let selectedTrack = 0;
    // Parse MusicXML into a MusicPiece
    const handleFileInput = async (event) => {
        const file = event.target.files[0];
        const n = file.name;
        if (n.endsWith(".xml") || n.endsWith(".musicxml")) {
            // MusicXML
            musicxml = await file.text();
        } else if (n.endsWith(".mxl")) {
            // Compressed MusicXML
            const compressed = await file.arrayBuffer();
            const extracted = await JSZip.loadAsync(compressed);
            // Get XML file with score from archive
            const scoreFile = Object.keys(extracted.files).filter(
                (d) => !d.startsWith("META")
            )[0];
            musicxml = await extracted.file(scoreFile).async("string");
        } else {
            musicxml = null;
            musicpiece = null;
            selectedTrack = 0;
            alert("Invalid file");
            return;
        }
        musicpiece = MusicPiece.fromMusicXml(n, musicxml);
        selectedTrack = 0;
        console.log("Menu: loaded musicpiece", musicpiece);
        submitFile(musicxml, musicpiece);
    };

    $: tracks = musicpiece?.tracks ?? [];

    let encodings = ["Tab", "Pianoroll", "Drums"];
    export let selectedEncoding = "Tab";

    let colorings = ["DR", "Clustering", "MusicVAE"];
    export let selectedColoring = "DR";

    let colormaps = [
        {
            name: "Rainbow",
            description: "many hues, similar brightness, but cyclical",
            map: (d) => d3.interpolateRainbow(d * 0.9),
        },
        {
            name: "Viridis",
            description: "dark-to-bright, colorblind-friendly",
            map: d3.interpolateViridis,
        },
        {
            name: "Cividis",
            description: "dark-to-bright, colorblind-friendly",
            map: d3.interpolateCividis,
        },
        {
            name: "Blues",
            description: "single-hue, easier to perceive distances",
            map: d3.interpolateBlues,
        },
        {
            name: "Warm",
            description: "left half of interpolateRainbow",
            map: d3.interpolateWarm,
        },
        {
            name: "Cool",
            description: "right half of interpolateRainbow",
            map: d3.interpolateCool,
        },
        {
            name: "Spectral",
            description: "many hues, not cyclical",
            map: d3.interpolateSpectral,
        },
        {
            name: "Sinebow",
            description: "many hues, but cyclical",
            map: (d) => d3.interpolateSinebow(d * 0.9),
        },
        {
            name: "Turbo",
            description: "",
            map: (d) => d3.interpolateTurbo(d),
        },
        {
            name: "CIELAB",
            description: "uniform lightness",
            map: (d) => (d) => d3.lab(75, 40, d * 256 - 128),
        },
    ];
    export let selectedColormap = colormaps[0];
</script>

<main>
    <h3>File</h3>

    <input
        type="file"
        on:input={handleFileInput}
        accept=".xml,.musicxml,.mxl"
    />

    <Select bind:value={selectedTrack} label="Track" disabled={!musicpiece}>
        {#each tracks as track, i}
            <Option value={i}>{i} {track.name}</Option>
        {/each}
    </Select>

    <Select
        bind:value={selectedEncoding}
        label="Encoding"
        disabled={!musicpiece}
    >
        {#each encodings as encoding}
            <Option value={encoding}>{encoding}</Option>
        {/each}
    </Select>

    <Select
        bind:value={selectedColoring}
        label="Coloring"
        disabled={!musicpiece}
    >
        {#each colorings as coloring}
            <Option value={coloring}>{coloring}</Option>
        {/each}
    </Select>

    <Select
        bind:value={selectedColormap}
        label="Colormap"
        disabled={!musicpiece}
    >
        {#each colormaps as colormap}
            <Option value={colormap}>
                {colormap.name}
            </Option>
        {/each}
    </Select>
    <div>{selectedColormap.description}</div>
</main>

<style>
    main {
        padding-left: 10px;
    }
</style>
