<script>
  import { afterUpdate } from 'svelte';
  import Select, { Option } from '@smui/select';
  import * as d3 from 'd3';
  import { Canvas, Chords, Utils } from 'musicvis-lib';
  import { drawColorRamp } from '../lib.js';

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
  let compactRepeatedNotes = true;

  let canvas;
  $: canvasHeight = height - 60;
  let colorRampCanvas;

  const drawVis = () => {
    // console.log("draw sheet", height, canvasHeight);
    // Canvas.setupCanvas(canvas);
    const isTab = encoding === 'Tab' || encoding === 'Tab (simple)';
    // Show for Tab but not Tab (simple)
    let showStrings = encoding === 'Tab';
    let showFrets = showStrings;

    const context = canvas.getContext('2d');
    const w = width;
    const h = canvasHeight;
    const mWidth = (width - 8) / mPerRow;
    const mWidthInner = mWidth - 2;
    const mHeight = Math.min(
      2 * mWidth,
      Math.floor((h - 10) / Math.ceil(measures.length / mPerRow))
    );
    const mHeightInner = mHeight - 10;
    const pitchExtent = d3.extent(measures.flat(), (d) => d.pitch);
    const noteHeight = isTab
      ? mHeightInner / 6
      : mHeightInner / (pitchExtent[1] - pitchExtent[0]);
    const noteEndHeight = isTab && showFrets ? noteHeight * 0.8 : 0;

    let scaleY;
    if (isTab) {
      scaleY = d3.scaleLinear().domain([1, 7]).range([0, mHeightInner]);
    } else {
      scaleY = d3
        .scaleLinear()
        .domain([pitchExtent[0] - 1, pitchExtent[1] + 1])
        .range([mHeightInner, 0]);
    }

    const measureOrSectMode = ['bars', 'sections'].includes(colorMode);

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
      // If a measure was selected, change colors to reflect distance to selected measure
      let cols;
      if (
        measureOrSectMode &&
        selectedMeasure !== null &&
        selectedColoring !== 'default'
      ) {
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
      context.imageSmoothingQuality = 'high';
      // Draw measures
      context.strokeStyle = 'black';
      context.textBaseline = 'middle';
      let currentChord = 0;
      for (const [index, measure] of measures.entries()) {
        const col = index % mPerRow;
        const row = Math.floor(index / mPerRow);
        const mX = col * mWidth + 4;
        const mY = row * mHeight + 10;
        context.font = `9px sans-serif`;
        context.fillStyle = '#666';
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
          context.save();
          context.strokeStyle = '#333';
          context.lineWidth = 4;
          context.strokeRect(mX, mY, mWidthInner, mHeightInner);
          context.restore();
        }
        // Background
        let bgColor;
        if (!measureOrSectMode || measure.length === 0) {
          bgColor = '#f8f8f8';
        } else {
          bgColor = cols[index];
        }
        context.fillStyle = bgColor;
        context.fillRect(mX, mY, mWidthInner, mHeightInner);
        if (measure.length === 0) {
          continue;
        }
        const scaleX = d3.scaleLinear().range([mX, mX + mWidthInner]);
        if (!displayLeadingRests || !measureTimes) {
          scaleX.domain([
            d3.min(measure, (d) => +d.start),
            d3.max(measure, (d) => +d.end),
          ]);
        } else {
          scaleX.domain([measureTimes[index - 1] ?? 0, measureTimes[index]]);
        }
        // Draw strings
        if (isTab && showStrings) {
          context.fillStyle =
            colorMode === 'bars' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)';
          for (let string = 1.5; string < 7; ++string) {
            context.fillRect(mX, mY + scaleY(string), mWidthInner, 1);
          }
        }

        // Draw notes
        const fn = Canvas.drawNoteTrapezoid;
        context.font = `7px sans-serif`;
        if (colorMode !== 'Harmonies') {
          for (const [index, note] of measure.entries()) {
            const x = scaleX(note.start);
            const y = mY + scaleY(isTab ? note.string : note.pitch);
            const width = scaleX(note.end) - x;
            context.fillStyle = '#333';
            if (measureOrSectMode && Utils.getColorLightness(bgColor) < 50) {
              context.fillStyle = '#eee';
            }
            if (colorMode === 'Notes') {
              context.fillStyle = cols[note.pitch % 12];
            }
            fn(context, x, y, width, noteHeight, noteEndHeight);
            // Draw fret numbers
            if (isTab && showFrets) {
              context.fillStyle =
                Utils.getColorLightness(context.fillStyle) > 50
                  ? 'black'
                  : 'white';
              const lastNote = measure[index - 1];
              if (
                !compactRepeatedNotes ||
                note.fret !== lastNote?.fret ||
                note.string !== lastNote?.string
              ) {
                context.fillText(note.fret, x + 1, y + noteHeight / 2 + 1);
              }
            }
          }
        } else {
          const chords = Chords.detectChordsByExactStart(measure);
          for (const chord of chords) {
            for (const note of chord) {
              const x = scaleX(note.start);
              const y = mY + scaleY(isTab ? note.string : note.pitch);
              const width = scaleX(note.end) - x;
              context.fillStyle = cols[currentChord];
              fn(context, x, y, width, noteHeight, noteEndHeight);
              // Draw fret numbers
              if (showFrets) {
                context.fillStyle =
                  Utils.getColorLightness(context.fillStyle) > 50
                    ? 'black'
                    : 'white';
                context.fillText(note.fret, x + 1, y + noteHeight / 2 + 1);
              }
            }
            currentChord++;
          }
        }
      }
    };
    draw();
  };

  afterUpdate(drawVis);

  $: drawColorRamp(colorRampCanvas, 50, 10, (d) => d3.interpolateBlues(1 - d));
</script>

<main>
  <div class="overviewTitle">Sheet</div>
  <div class="control">
    <div>
      <Select bind:value={selectedColoring} label="Coloring when selected">
        <Option value="default" title="Draw as if nothing was selected">
          Default
        </Option>
        <Option value="identical" title="Highlight identical bars">
          Identical
        </Option>
        <Option value="distance" title="Distance to selected bar">
          Distance
        </Option>
      </Select>
    </div>
    <div
      class="legend"
      style="visibility: {selectedColoring === 'distance'
        ? 'visible'
        : 'hidden'}">
      <div>Identical</div>
      <canvas bind:this={colorRampCanvas} width={50} height={10} />
      <div>Different</div>
    </div>
    <div>
      <label>
        Compact repeated notes
        <input type="checkbox" bind:checked={compactRepeatedNotes} />
      </label>
    </div>
    <div>
      <label>
        Leading/trailing rests
        <input type="checkbox" bind:checked={displayLeadingRests} />
      </label>
    </div>
    <!-- <div>
      <label>
        Bars per row
        <input type="range" bind:value={mPerRow} min={1} max={100} step={1} />
      </label>
    </div> -->
  </div>
  <canvas {width} height={canvasHeight} bind:this={canvas} />
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }

  .control {
    margin-bottom: 4px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    align-items: center;
  }

  .legend {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 10px;
    align-items: center;
  }
</style>
