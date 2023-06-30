<script>
  import { Midi, MusicPiece } from 'musicvis-lib';
  import * as d3 from 'd3';
  import JSZip from 'jszip';
  import { createEventDispatcher } from 'svelte';
  import { drawColorRamp } from './lib/lib.js';

  const dispatch = createEventDispatcher();
  const submitFile = (musicxml, musicpiece) =>
    dispatch('fileopened', { musicxml, musicpiece });

  export let musicxml = null;
  export let alphaTabScore = null;
  export let musicpiece = null;
  export let selectedTrack = 0;
  export let selectedSection = null;
  export let selectedMeasure = null;
  export let sectionInfo = null;

  let fileName = '';
  let tracks = [];
  let fileInput;
  let colorRampCanvas;

  // Parse MusicXML into a MusicPiece
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('Menu: emptied musicpiece', musicpiece);
      submitFile(musicxml, musicpiece);
      return;
    }
    // Reset only now that there is valid file, to avoid user mistakes
    fileName = '';
    musicxml = null;
    alphaTabScore = null;
    musicpiece = null;
    tracks = [];
    selectedTrack = 0;
    selectedSection = null;
    selectedMeasure = null;
    const n = file.name;
    if (n.endsWith('.xml') || n.endsWith('.musicxml')) {
      // MusicXML
      musicxml = await file.text();
      musicpiece = MusicPiece.fromMusicXml(n, musicxml);
    } else if (n.endsWith('.mxl')) {
      // Compressed MusicXML
      const compressed = await file.arrayBuffer();
      const extracted = await JSZip.loadAsync(compressed);
      // Get XML file with score from archive
      const scoreFile = Object.keys(extracted.files).filter(
        (d) => !d.startsWith('META')
      )[0];
      musicxml = await extracted.file(scoreFile).async('string');
      musicpiece = MusicPiece.fromMusicXml(n, musicxml);
    } else {
      alert('Invalid file');
      return;
    }
    fileName = n;
    tracks = musicpiece.tracks;
    console.log('Menu: loaded musicpiece', musicpiece, tracks);
    submitFile(musicxml, musicpiece);
  };

  let encodings = [
    'Tab',
    'Tab (simple)',
    'Pianoroll',
    // 'Drums',
    // 'Staff',
    'None',
  ];
  export let selectedEncoding = 'Tab';

  let metrics = [
    { name: 'LS pitch', description: '', value: 'levenshteinPitch' },
    {
      name: 'LS pitch & start',
      description: '',
      value: 'levenshteinPitchStart',
    },
    { name: 'GT pitch', description: 'gotohPitch', value: '' },
    { name: 'Jaccard pitch', description: '', value: 'jaccardPitch' },
  ];
  export let selectedMetric = metrics[0];

  // let colorings = ['DR', 'Clustering', 'Compression', 'Occurence'];
  // let colorings = ['DR', 'Clustering', 'Occurence'];
  let colorings = ['DR', 'Clustering'];
  export let selectedColoring = 'DR';
  // export let selectedColoring = 'Compression';
  export let clusterThreshold = 0;
  export let compressionDepth = 2;

  export let selectedColorMode = 'bars';

  let colormaps = [
    {
      name: 'Spectral',
      description: 'many hues, not cyclical',
      map: d3.interpolateSpectral,
    },
    {
      name: 'Warm',
      description: 'left half of interpolateRainbow',
      map: d3.interpolateWarm,
    },
    {
      name: 'Cool',
      description: 'right half of interpolateRainbow',
      map: d3.interpolateCool,
    },
    // {
    //   name: 'Rainbow',
    //   description: 'many hues, similar brightness, but cyclical',
    //   map: (d) => d3.interpolateRainbow(d * 0.9),
    // },
    // {
    //   name: 'Sinebow',
    //   description: 'many hues, but cyclical',
    //   map: (d) => d3.interpolateSinebow(d * 0.9),
    // },
    {
      name: 'Turbo',
      description: 'many hues',
      map: (d) => d3.interpolateTurbo(d),
    },
    {
      name: 'Viridis',
      description: 'dark-to-bright, colorblind-friendly',
      map: d3.interpolateViridis,
    },
    {
      name: 'Cividis',
      description: 'dark-to-bright, colorblind-friendly',
      map: d3.interpolateCividis,
    },
    {
      name: 'Blues',
      description: 'single-hue, easier to perceive distances',
      map: d3.interpolateBlues,
    },
    {
      name: 'White',
      description: 'White, no coloring',
      map: () => 'rgb(238, 238, 238)',
    },
  ];
  export let selectedColormap = colormaps[0];

  $: drawColorRamp(colorRampCanvas, 200, 10, selectedColormap?.map);
</script>

<main>
  <button on:click="{() => fileInput.click()}">Open file</button>
  <input
    type="file"
    accept=".xml,.musicxml,.mxl,.gp"
    style="display: none"
    bind:this="{fileInput}"
    on:input="{handleFileInput}"
  />
  <div class="fileName">
    {fileName}
  </div>

  <label>
    <span>Track</span>
    <select bind:value="{selectedTrack}" disabled="{!musicpiece}">
      {#each tracks as track, i}
        <option value="{i}" title="{`${i} ${track.name}`}">
          {i}
          {track.name.slice(0, 20)}
        </option>
      {/each}
    </select>
  </label>

  <label>
    <span>Note encoding</span>
    <select bind:value="{selectedEncoding}" disabled="{!musicpiece}">
      {#each encodings as encoding}
        <option value="{encoding}">
          {encoding}
        </option>
      {/each}
    </select>
  </label>

  <!-- <Select bind:value={selectedMetric} label="Metric" disabled={!musicpiece}>
    {#each metrics as metric}
      <Option value={metric} title={metric.description}>
        {metric.name}
      </Option>
    {/each}
  </Select> -->

  <label>
    <span>Coloring</span>
    <select bind:value="{selectedColoring}" disabled="{!musicpiece}">
      {#each colorings as coloring}
        <option ion value="{coloring}">
          {coloring}
        </option>
      {/each}
    </select>
  </label>

  {#if selectedColoring === 'Clustering'}
    <label>
      <span>Threshold</span>
      <input
        type="range"
        bind:value="{clusterThreshold}"
        min="{0}"
        max="{1}"
        step="{0.05}"
      />
    </label>
  {/if}
  {#if selectedColoring === 'Compression'}
    <label>
      <span>Depth</span>
      <input
        type="range"
        bind:value="{compressionDepth}"
        min="{0}"
        max="{4}"
        step="{1}"
      />
      <span>{compressionDepth}</span>
    </label>
  {/if}

  <label>
    <span>Color mode</span>
    <select bind:value="{selectedColorMode}" disabled="{!musicpiece}">
      <option value="bars" title="bars">Bars</option>
      <option value="sections" title="sections">Sections</option>
    </select>
  </label>

  <label>
    <span>Color map</span>
    <select bind:value="{selectedColormap}" disabled="{!musicpiece}">
      {#each colormaps as colormap}
        <option value="{colormap}" title="{colormap.description}">
          {colormap.name}
        </option>
      {/each}
    </select>
    <canvas bind:this="{colorRampCanvas}" width="{200}" height="{10}"></canvas>
  </label>

  <div style="margin-top: 20px">
    <button
      disabled="{!musicpiece ||
        (selectedSection === null && selectedMeasure === null)}"
      on:click="{() => {
        selectedSection = null;
        selectedMeasure = null;
      }}"
    >
      Reset selection
    </button>
  </div>

  <div style="margin-top: 20px">
    {#if tracks[selectedTrack]?.tuningPitches}
      <div>
        Tuning:
        {tracks[selectedTrack]?.tuningPitches
          ?.map((d) => Midi.getMidiNoteByNr(d).label)
          .join(' ')}
      </div>
    {/if}
    {#if sectionInfo && selectedSection !== null}
      Current section: {selectedSection + 1} - {sectionInfo[selectedSection]
        .name}
    {/if}
  </div>
</main>

<style>
  main {
    width: 230px;
  }

  .fileName {
    padding: 10px 0;
  }

  label {
    display: grid;
    margin: 5px;
    grid-template-columns: auto;
    gap: 2px;
  }

  canvas {
    margin-top: 3px;
    border-radius: 3px;
    width: 100%;
  }
</style>
