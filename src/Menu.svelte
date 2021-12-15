<script>
    import { MusicPiece } from "../node_modules/musicvis-lib/dist/musicvislib";
    import * as d3 from "d3";
    import JSZip from "jszip";
    import { createEventDispatcher } from "svelte";
    import Select, { Option } from "@smui/select";

    const dispatch = createEventDispatcher();
    const submitFile = (musicpiece) => dispatch("fileopened", { musicpiece });

    export let musicpiece = null;
    export let selectedTrack = null;
    // Parse MusicXML into a MusicPiece
    const handleFileInput = async (event) => {
        const file = event.target.files[0];
        const n = file.name;
        // MusicXML
        if (n.endsWith(".xml") || n.endsWith(".musicxml")) {
            musicpiece = MusicPiece.fromMusicXml(n, await file.text());
        }
        // Compressed MusicXML
        if (n.endsWith(".mxl")) {
            const compressed = await file.arrayBuffer();
            const extracted = await JSZip.loadAsync(compressed);
            // Get XML file with score from archive
            const scoreFile = Object.keys(extracted.files).filter(
                (d) => !d.startsWith("META")
            )[0];
            const xml = await extracted.file(scoreFile).async("string");
            musicpiece = MusicPiece.fromMusicXml(n, xml);
        }
        console.log(musicpiece);
        // selectedTrack = musicpiece.tracks[0];
        submitFile(musicpiece);
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
    ];
    export let selectedColormap = colormaps[0];
</script>

<main>
    <h3>File</h3>

    <input type="file" on:input={handleFileInput} />

    <Select bind:value={selectedTrack} label="Track">
        {#each tracks as track}
            <Option value={track}>{track.name}</Option>
        {/each}
    </Select>

    <Select bind:value={selectedEncoding} label="Encoding">
        {#each encodings as encoding}
            <Option value={encoding}>{encoding}</Option>
        {/each}
    </Select>

    <Select bind:value={selectedColoring} label="Coloring">
        {#each colorings as coloring}
            <Option value={coloring}>{coloring}</Option>
        {/each}
    </Select>

    <Select bind:value={selectedColormap} label="Colormap">
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
