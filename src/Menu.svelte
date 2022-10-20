<script>
  import { MusicPiece } from "musicvis-lib";
  import * as d3 from "d3";
  import JSZip from "jszip";
  import { createEventDispatcher } from "svelte";
  import Select, { Option } from "@smui/select";
  import Button from "@smui/button";
  import Slider from "@smui/slider";
  import FormField from "@smui/form-field";
  import { drawColorRamp } from "./lib.js";

  const dispatch = createEventDispatcher();
  const submitFile = (musicxml, musicpiece) =>
    dispatch("fileopened", { musicxml, musicpiece });

  export let musicxml = null;
  export let musicpiece = null;
  export let selectedTrack = 0;
  export let selectedMeasure = null;
  export let selectedSection = null;

  let fileName = "";
  let tracks = [];
  let fileInput;
  let colorRampCanvas;

  // Parse MusicXML into a MusicPiece
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("Menu: emptied musicpiece", musicpiece);
      submitFile(musicxml, musicpiece);
      return;
    }
    // Reset only now that there is valid file, to avoid user mistakes
    fileName = "";
    musicxml = null;
    musicpiece = null;
    tracks = [];
    selectedTrack = 0;
    selectedMeasure = null;
    selectedSection = null;
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
      alert("Invalid file");
      return;
    }
    fileName = n;
    musicpiece = MusicPiece.fromMusicXml(n, musicxml);
    tracks = musicpiece.tracks;
    console.log("Menu: loaded musicpiece", musicpiece, tracks);
    submitFile(musicxml, musicpiece);
  };

  let encodings = [
    "Tab",
    "Tab (simple)",
    "Pianoroll",
    "Drums",
    "Staff",
    "None",
  ];
  export let selectedEncoding = "Tab";

  let colorings = ["DR", "Clustering", "Compression"];
  export let selectedColoring = "DR";
  // export let selectedColoring = 'Compression';
  export let clusterThreshold = 0;
  export let compressionDepth = 2;

  export let selectedColorMode = "bars";

  let colormaps = [
    {
      name: "Spectral",
      description: "many hues, not cyclical",
      map: d3.interpolateSpectral,
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
      name: "Rainbow",
      description: "many hues, similar brightness, but cyclical",
      map: (d) => d3.interpolateRainbow(d * 0.9),
    },
    {
      name: "Sinebow",
      description: "many hues, but cyclical",
      map: (d) => d3.interpolateSinebow(d * 0.9),
    },
    {
      name: "Turbo",
      description: "many hues",
      map: (d) => d3.interpolateTurbo(d),
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
      name: "White",
      description: "White, no coloring",
      map: () => "rgb(238, 238, 238)",
    },
  ];
  export let selectedColormap = colormaps[0];

  $: drawColorRamp(colorRampCanvas, 200, 10, selectedColormap?.map);
</script>

<main>
  <Button on:click={() => fileInput.click()}>Open file</Button>
  <input
    type="file"
    accept=".xml,.musicxml,.mxl"
    style="display: none"
    bind:this={fileInput}
    on:input={handleFileInput}
  />
  <div class="fileName">
    {fileName}
  </div>

  <Select bind:value={selectedTrack} label="Track" disabled={!musicpiece}>
    {#each tracks as track, i}
      <Option value={i} title={`${i} ${track.name}`}>
        {i}
        {track.name.slice(0, 20)}
      </Option>
    {/each}
  </Select>

  <Select
    bind:value={selectedEncoding}
    label="Note encoding"
    disabled={!musicpiece}
  >
    {#each encodings as encoding}
      <Option value={encoding}>
        {encoding}
      </Option>
    {/each}
  </Select>

  <Select bind:value={selectedColoring} label="Coloring" disabled={!musicpiece}>
    {#each colorings as coloring}
      <Option value={coloring}>
        {coloring}
      </Option>
    {/each}
  </Select>

  {#if selectedColoring === "Clustering"}
    <FormField align="end" style="width: 220px; display: flex;">
      <Slider
        style="flex-grow: 1;"
        bind:value={clusterThreshold}
        min={0}
        max={1}
        step={0.01}
        input$aria-label="Cluster threshold"
      />
      <span
        slot="label"
        style="padding-right: 0; width: max-content; display: block;"
      >
        Threshold
      </span>
    </FormField>
  {/if}
  {#if selectedColoring === "Compression"}
    <FormField align="end" style="width: 200px; display: flex;">
      <Slider
        style="flex-grow: 1;"
        bind:value={compressionDepth}
        min={0}
        max={4}
        step={1}
        input$aria-label="Compression depth"
      />
      <span
        slot="label"
        style="padding-right: 0; width: max-content; display: block;"
      >
        Depth
      </span>
      <span>{compressionDepth}</span>
    </FormField>
  {/if}

  <Select
    bind:value={selectedColorMode}
    label="Color mode"
    disabled={!musicpiece}
  >
    <Option value="bars" title="bars">Bars</Option>
    <Option value="sections" title="sections">Sections</Option>
  </Select>

  <Select bind:value={selectedColormap} label="Colormap" disabled={!musicpiece}>
    {#each colormaps as colormap}
      <Option value={colormap} title={colormap.description}>
        {colormap.name}
      </Option>
    {/each}
  </Select>

  <div>
    <canvas bind:this={colorRampCanvas} width={200} height={10} />
  </div>

  <div style="margin-top: 20px">
    <Button
      disabled={!musicpiece ||
        (selectedSection === null && selectedMeasure === null)}
      on:click={() => {
        selectedSection = null;
        selectedMeasure = null;
      }}
    >
      Reset selection
    </Button>
  </div>
</main>

<style>
  main {
    width: 250px;
  }

  .fileName {
    padding: 10px 0;
  }
</style>
