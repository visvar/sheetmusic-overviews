<script>
  import { afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { drawColorRamp } from '../lib/lib.js';
  import BarRenderer from '../lib/BarRenderer.js';

  export let width;
  export let height;
  export let track;
  export let colorMode = 'bars';
  export let measures;
  export let measureTimes;
  export let measureDists;
  export let selectedMeasure;
  export let colors;
  export let sectionInfo;
  export let sectionColors;
  export let encoding;
  export let displayLeadingRests = false;

  const chromScaleForDistance = (d) => d3.interpolateBlues(1 - d);

  let mPerRow = 20;
  /**
   * @type {'default'|'identical'|'distance'}
   */
  let selectedColoring = 'default';
  let compactRepeatedNotes = false;

  let canvas;
  $: canvasHeight = height - 60;
  let colorRampCanvas;

  const drawVis = () => {
    // Canvas.setupCanvas(canvas);
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    const w = width;
    const h = canvasHeight;
    const mWidth = (width - 8) / mPerRow;
    const mWidthInner = mWidth - 2;
    const mHeight = Math.min(
      2 * mWidth,
      Math.floor((h - 10) / Math.ceil(measures.length / mPerRow))
    );
    const mHeightInner = mHeight - 10;

    // Setup BarRenderer
    const renderer = new BarRenderer(
      encoding,
      measures.flat(),
      mWidthInner,
      mHeightInner
    );

    // Onclick handler
    // Click to color by distance to selected measure
    canvas.onmouseup = (event) => {
      event.preventDefault();
      const row = Math.floor(event.offsetY / mHeight);
      const col = Math.floor(event.offsetX / mWidth);
      selectedMeasure = row * mPerRow + col;
      if (selectedMeasure > measures.length - 1) {
        selectedMeasure = null;
      }
    };
    // Double-click to reset
    canvas.ondblclick = (event) => {
      event.preventDefault();
      selectedMeasure = null;
    };

    const draw = () => {
      // console.log(measures);
      // console.log(measureTimes);

      // If a measure was selected, change colors to reflect distance to selected measure
      let cols;
      if (selectedMeasure !== null && selectedColoring !== 'default') {
        // Distance of all measures to the currently selected one
        let dists = measureDists[selectedMeasure];
        if (selectedColoring === 'identical') {
          // Highlight identical measures
          cols = dists.map((d) =>
            d === 0 ? 'steelblue' : 'rgb(238, 238, 238)'
          );
        } else {
          // Color all measures by distance
          const distColorScale = d3
            .scaleLinear()
            .domain(d3.extent(dists))
            .range([0, 1]);
          const distColor = (dist) =>
            chromScaleForDistance(distColorScale(dist));
          cols = dists.map(distColor);
        }
      } else if (colorMode === 'sections') {
        cols = sectionInfo.flatMap((section, index) =>
          new Array(section.endMeasure - section.startMeasure + 1).fill(
            sectionColors[index]
          )
        );
      } else {
        cols = colors;
      }

      // Reset background
      context.fillStyle = 'white';
      context.fillRect(0, 0, w, h);
      // Draw measures
      context.strokeStyle = 'black';
      context.textBaseline = 'middle';
      context.font = `9px sans-serif`;
      context.fillStyle = '#666';
      for (const [index, measure] of measures.entries()) {
        const col = index % mPerRow;
        const row = Math.floor(index / mPerRow);
        const mX = col * mWidth + 4;
        const mY = row * mHeight + 10;
        // Rehearsal / section name
        const rehearsal = track.measureRehearsalMap.get(index);
        if (rehearsal) {
          context.fillText(rehearsal, mX, mY - 3.5);
        } else if (index % 5 === 0) {
          // Measure number
          context.fillText(index + 1, mX, mY - 3.5);
        }
        // If selected, draw border
        if (index === selectedMeasure) {
          renderer.drawHighlightBorder(context, mX, mY);
        }

        renderer.render(context, index, measure, mX, mY, cols[index], {
          radius: 3,
          showFrets: true,
          displayLeadingRests,
          measureTimes,
          compactRepeatedNotes,
        });
      }
    };
    draw();
  };

  afterUpdate(drawVis);

  $: drawColorRamp(colorRampCanvas, 50, 10, (d) => d3.interpolateBlues(1 - d));
</script>

<main>
  <div class="overviewTitle">Compact</div>
  <div class="control">
    <select bind:value="{selectedColoring}" title="Coloring when selected">
      <option value="default" title="Draw as if nothing was selected">
        Default
      </option>
      <option value="identical" title="Highlight identical bars">
        Identical
      </option>
      <option value="distance" title="Distance to selected bar">
        Distance
      </option>
    </select>
    <div
      class="legend"
      style="visibility: {selectedColoring === 'distance'
        ? 'visible'
        : 'hidden'}"
    >
      <div>Identical</div>
      <canvas
        bind:this="{colorRampCanvas}"
        width="{50}"
        height="{10}"
        style="border-radius: 3px"></canvas>
      <div>Different</div>
    </div>
    <!-- <label>
      Compact repeated notes
      <input type="checkbox" bind:checked="{compactRepeatedNotes}" />
    </label>
    <label>
      Leading/trailing rests
      <input type="checkbox" bind:checked="{displayLeadingRests}" />
    </label> -->
    <label>
      <span>Bars per row</span>
      <input
        type="range"
        bind:value="{mPerRow}"
        min="{1}"
        max="{100}"
        step="{1}"
      />
    </label>
  </div>
  <canvas width="{width}" height="{canvasHeight}" bind:this="{canvas}"></canvas>
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }

  .control {
    height: 28px;
    margin-bottom: 4px;
    display: grid;
    grid-template-columns: repeat(5, auto);
    gap: 5px;
    justify-items: center;
    align-items: center;
  }

  .legend {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 10px;
    align-items: center;
  }

  label {
    display: grid;
    grid-template-columns: auto auto;
    gap: 5px;
    align-items: center;
  }
</style>
