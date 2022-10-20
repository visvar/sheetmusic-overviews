<script>
  import { afterUpdate } from "svelte";
  import * as d3 from "d3";
  import { Canvas } from "musicvis-lib";
  import { getMeasures } from "../lib.js";

  export let width;
  export let height;
  export let musicpiece;
  export let sectionInfo;
  export let selectedMeasure = null;
  export let selectedSection = null;

  let canvas;

  const drawVis = () => {
    const marginTop = 25;
    const marginLeft = 110;
    const marginBottom = 20;

    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";

    // Reset
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const tracks = musicpiece.tracks;
    const maxMeasures = +d3.max(tracks, (d) => d.measureIndices.length);

    const mWidth = (width - marginLeft - 2) / maxMeasures;
    const mWidthInner = mWidth - 1;
    const mHeight = Math.min(
      (height - marginTop - marginBottom) / tracks.length,
      14
    );
    const mHeightInner = mHeight - 1;
    const fontSize = mHeight * 0.85;
    context.font = `${fontSize}px sans-serif`;

    // Sections
    for (const section of sectionInfo) {
      const { name, startMeasure, length } = section;
      const x = marginLeft + startMeasure * mWidth + 1;
      const sectionWidth = length * mWidth - 2;
      context.fillStyle = "#333";
      context.fillText(name, x, 10);
      context.fillStyle = "#666";
      Canvas.drawBracketH(context, x, marginTop - 7, sectionWidth, 5);
      // Avoid overlap
      context.fillStyle = "white";
      context.fillRect(x + sectionWidth, 0, width + 1, marginTop);
    }

    // Measure labels
    context.fillStyle = "#333";
    for (const [tIndex, track] of tracks.entries()) {
      const y = marginTop + (tIndex + 1) * mHeight;
      context.fillText(track.name, 0, y);
    }
    // Avoid overlap
    context.fillStyle = "white";
    context.fillRect(marginLeft - 2, marginTop, width, height);

    // Measures
    for (const [tIndex, track] of tracks.entries()) {
      const y = marginTop + tIndex * mHeight;
      const measures = getMeasures(track);
      for (const [mIndex, measure] of measures.entries()) {
        const x = marginLeft + mIndex * mWidth;
        if (measure.length > 0) {
          context.fillStyle = d3.schemeTableau10[tIndex % 10];
          context.fillRect(x, y, mWidthInner, mHeightInner);
        } else {
          context.fillStyle = "#eee";
          context.fillRect(x, y, mWidthInner, mHeightInner);
        }
      }
    }

    // Measure numbers
    const y = height - marginBottom + fontSize + 3;
    context.fillStyle = "#333";
    for (let i = 9; i < maxMeasures; i += 10) {
      const x = marginLeft + i * mWidth;
      context.fillText(i + 1, x, y);
    }

    // Highlight for selected measure
    if (selectedMeasure !== null && selectedMeasure !== undefined) {
      const x = marginLeft + selectedMeasure * mWidth;
      context.fillStyle = "rgba(128, 128, 128, 0.2)";
      context.fillRect(x - 1, 0, mWidth - 2, height);
    }

    // Highlight for selected section
    if (selectedSection !== null && selectedSection !== undefined) {
      const { startMeasure, length } = sectionInfo[selectedSection];
      const mx = marginLeft + startMeasure * mWidth + 1;
      const sectionWidth = length * mWidth - 2;
      context.fillStyle = "rgba(128, 128, 128, 0.1)";
      context.fillRect(mx - 1, 0, sectionWidth - 2, height);
    }

    // Click to select measure, ...
    canvas.onmouseup = (event) => {
      // Measure selected
      event.preventDefault();
      const measure = Math.floor((event.offsetX - marginLeft) / mWidth);
      if (measure >= 0) {
        selectedMeasure = measure;
      }
    };
    // Double-click to reset
    canvas.ondblclick = (event) => {
      event.preventDefault();
      selectedMeasure = null;
    };
  };

  afterUpdate(drawVis);
</script>

<main style={`height: ${height}px`}>
  <div class="overviewTitle">Tracks</div>
  <canvas {width} {height} bind:this={canvas} />
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }
</style>
