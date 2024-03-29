<script>
  import { afterUpdate } from "svelte";
  import * as d3 from "d3";
  import { Canvas, Note } from "musicvis-lib";

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
    const marginRight = 10;
    const marginBottom = 20;

    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";

    // Reset
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const tracks = musicpiece.tracks;
    const maxMeasures = +d3.max(tracks, (d) => d.measureIndices.length);

    const mWidth = (width - marginLeft - marginRight - 2) / maxMeasures;
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
      const measures = track.getMeasures(Note.startPitchComparator);
      for (const [mIndex, measure] of measures.entries()) {
        const x = marginLeft + mIndex * mWidth;
        if (measure.length > 0) {
          context.fillStyle = d3.schemeTableau10[tIndex % 10];
        } else {
          context.fillStyle = "#eee";
        }
        Canvas.drawRoundedRect(context, x, y, mWidthInner, mHeightInner, 2);
        context.fill();
      }
    }

    // Measure numbers
    const y = height - marginBottom + fontSize + 3;
    const step = Math.ceil(3 / mWidth) * 10;
    context.fillStyle = "#333";
    for (let i = step - 1; i < maxMeasures - step + 1; i += step) {
      const x = marginLeft + i * mWidth;
      context.fillText(i + 1, x, y);
    }

    // Highlight for selected measure
    if (selectedMeasure !== null && selectedMeasure !== undefined) {
      const x = marginLeft + selectedMeasure * mWidth;
      context.fillStyle = "rgba(128, 128, 128, 0.2)";
      context.fillRect(x, 0, mWidth, height);
    }

    // Highlight for selected section
    if (selectedSection !== null && selectedSection !== undefined) {
      const { startMeasure, length } = sectionInfo[selectedSection];
      const mx = marginLeft + startMeasure * mWidth + 1;
      const sectionWidth = length * mWidth - 2;
      context.fillStyle = "rgba(128, 128, 128, 0.12)";
      Canvas.drawRoundedRect(
        context,
        mx - 1,
        2,
        sectionWidth + 2,
        height - 4,
        5
      );
      context.fill();
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
