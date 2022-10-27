<script>
  import { afterUpdate } from "svelte";
  import { Canvas, Chords } from "musicvis-lib";
  import { drawVerticalText } from "../lib.js";
  import BarRenderer from "../lib/BarRenderer.js";

  export let width;
  export let height;
  export let encoding;
  export let sectionInfo;
  export let sections;
  export let sectionColors;
  export let selectedSection = null;
  export let measures;
  export let measureColors;
  export let selectedMeasureOfSection = null;
  export let selectedMeasure = null;
  export let harmonyColors;
  export let noteColors;

  let showHarmoniesAndNotes = false;
  let canvas;

  /**
   * Determines the section a measure occurs in
   * @param {object[]} sectionInfo section info objects
   * @param {number} measureIndex measure index
   * @returns {number} section index or -1 if not found
   */
  const getSectionIndexFromMeasureIndex = (sectionInfo, measureIndex) => {
    for (const [index, section] of sectionInfo.entries()) {
      if (
        measureIndex >= section.startMeasure &&
        measureIndex <= section.endMeasure
      ) {
        return index;
      }
    }
    return -1;
  };

  // Ensure that if a measure is selected, its section is too
  $: if (selectedMeasure !== null) {
    selectedSection = getSectionIndexFromMeasureIndex(
      sectionInfo,
      selectedMeasure
    );
    const startMeasure = sectionInfo[selectedSection].startMeasure;
    selectedMeasureOfSection = selectedMeasure - startMeasure;
  }

  const drawVis = () => {
    // Canvas.setupCanvas(canvas);
    const marginLeft = 15;
    const w = width - marginLeft;
    const rowCount = showHarmoniesAndNotes ? 7 : 3;
    const levelHeight = Math.floor((height - 50) / rowCount);
    const rowHeight = levelHeight;
    const gapHeight = levelHeight;

    const context = canvas.getContext("2d");
    context.font = `11px sans-serif`;
    context.lineWidth = 0.25;

    // Globals
    let notes;
    let currMeasures;
    let allHarmonies;
    let sWidth;
    let mWidth;
    let hWidth;
    let nWidth;

    // Onclick handler
    // Click to select and filter by section, measure, ...
    canvas.onmouseup = (event) => {
      event.preventDefault();
      const row = Math.floor(event.offsetY / (rowHeight + gapHeight));
      const x = event.offsetX - marginLeft;
      if (row === 0) {
        // Section selected
        selectedSection = Math.floor(x / sWidth);
        selectedMeasureOfSection = null;
        selectedMeasure = null;
      } else if (row === 1) {
        // Measure selected
        selectedMeasureOfSection = Math.floor(x / mWidth);
        if (selectedSection !== null) {
          const startMeasure = sectionInfo[selectedSection].startMeasure;
          selectedMeasure = startMeasure + selectedMeasureOfSection;
        }
      }
      draw();
    };
    // Double-click to reset
    canvas.ondblclick = (event) => {
      event.preventDefault();
      selectedSection = null;
      selectedMeasureOfSection = null;
      selectedMeasure = null;
      draw();
    };

    // Draw
    function draw() {
      // Get filtered data
      currMeasures = measures;
      if (selectedSection !== null) {
        const { startMeasure, endMeasure } = sectionInfo[selectedSection];
        currMeasures = measures.slice(startMeasure, endMeasure + 1);
      }
      allHarmonies = Chords.detectChordsByExactStart(currMeasures.flat());
      if (selectedMeasure !== null) {
        console.log(currMeasures);
        console.log(allHarmonies);
        allHarmonies = Chords.detectChordsByExactStart(
          currMeasures[selectedMeasureOfSection]
        );
      }
      notes = allHarmonies.flat(Infinity);

      // Config
      const renderParams = {
        radius: 3,
        showFrets: true,
      };

      // Reset
      context.resetTransform();
      context.imageSmoothingQuality = "high";
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);

      // Draw labels for rows
      let y = 10 + rowHeight / 2;
      for (const label of ["Sections", "Bars", "Harmnonies", "Notes"]) {
        drawVerticalText(context, 0, y, label, "#333", 13, true);
        y += rowHeight * 2;
      }
      context.translate(marginLeft, 0);

      // Draw sections
      sWidth = w / sections.length;
      const sWidthInner = sWidth > 3 ? sWidth - 1 : sWidth;
      const sRenderer = new BarRenderer(
        encoding,
        measures.flat(),
        sWidthInner,
        rowHeight
      );
      let rowY = 10;
      for (const [index, section] of sections.entries()) {
        const col = index;
        const mX = col * sWidth;
        // Background
        const bgColor =
          sectionColors.length < 2 ? "#f8f8f8" : sectionColors[index];
        // Section name
        context.fillStyle = "white";
        context.fillRect(mX - 5, rowY - 10, w, 10);
        context.fillStyle = "black";
        context.fillText(sectionInfo[index].name, mX, rowY - 2);
        // Notes
        sRenderer.render(
          context,
          index,
          section,
          mX,
          rowY,
          bgColor,
          renderParams
        );
        if (selectedSection === index) {
          sRenderer.drawHighlightBorder(context, mX, rowY, 5, 2, "#666");
        }
      }

      // Measures
      mWidth = w / currMeasures.length;
      const mWidthInner = mWidth > 3 ? mWidth - 1 : mWidth;
      // Connection section-measures
      const y1 = rowY + rowHeight;
      const y2 = y1 + gapHeight;
      if (selectedSection === null) {
        for (const [index, section] of sectionInfo.entries()) {
          if (index > 0) {
            const x1 = index * sWidth;
            const x2 = section.startMeasure * mWidth;
            Canvas.drawBezierConnectorY(context, x1, y1, x2, y2);
          }
        }
      } else {
        const x1 = selectedSection * sWidth;
        const x1b = (selectedSection + 1) * sWidth;
        Canvas.drawBezierConnectorY(context, x1, y1, 0, y2);
        Canvas.drawBezierConnectorY(context, x1b, y1, w, y2);
        context.fillStyle = "#88888822";
        drawBezierFunnelY(context, y1, y2, x1, x1b, 0, w);
      }
      // Draw measures
      const mRenderer = sRenderer.setBarWidth(mWidthInner);
      rowY += rowHeight + gapHeight;
      for (const [index, measure] of currMeasures.entries()) {
        const col = index;
        const mX = col * mWidth;
        // Background
        const bgColor = measure.length === 0 ? "#f8f8f8" : measureColors[index];
        mRenderer.render(
          context,
          index,
          measure,
          mX,
          rowY,
          bgColor,
          renderParams
        );
        if (selectedMeasureOfSection === index) {
          mRenderer.drawHighlightBorder(context, mX, rowY, 5, 2, "#666");
        }
      }

      if (showHarmoniesAndNotes) {
        // Harmonies
        hWidth = w / allHarmonies.length;
        const hWidthInner = hWidth > 3 ? hWidth - 1 : hWidth;
        const hRenderer = mRenderer.setBarWidth(hWidthInner);
        // Connection measures-harmonies
        const y1h = rowY + rowHeight;
        const y2h = y1h + gapHeight;
        if (selectedMeasure === null) {
          let currentHarmony = 0;
          for (const [index, measure] of currMeasures.entries()) {
            const harmmoniesOfMeasure =
              Chords.detectChordsByExactStart(measure);
            const x1 = index * mWidth;
            const x2 = currentHarmony * hWidth;
            currentHarmony += harmmoniesOfMeasure.length;
            Canvas.drawBezierConnectorY(context, x1, y1h, x2, y2h);
          }
        } else {
          const x1 = selectedMeasureOfSection * mWidth;
          const x1b = (selectedMeasureOfSection + 1) * mWidth;
          Canvas.drawBezierConnectorY(context, x1, y1h, 0, y2h);
          Canvas.drawBezierConnectorY(context, x1b, y1h, w, y2h);
          context.fillStyle = "#88888822";
          drawBezierFunnelY(context, y1h, y2h, x1, x1b, 0, w);
        }

        // Draw harmonies
        rowY += rowHeight + gapHeight;
        for (const [index, chord] of allHarmonies.entries()) {
          const col = index;
          const mX = col * hWidth;
          const bgColor = harmonyColors[index];
          context.fillStyle = harmonyColors[index];
          hRenderer.render(context, index, chord, mX, rowY, bgColor, {
            ...renderParams,
            showFrets: hWidthInner > 10,
          });
        }

        // Notes
        nWidth = w / notes.length;
        const nWidthInner = nWidth > 3 ? nWidth - 1 : nWidth;
        const nRenderer = hRenderer.setBarWidth(nWidthInner);
        // Connection harmonies-notes
        const y1n = rowY + rowHeight;
        const y2n = y1n + gapHeight;
        let currentNote = 0;
        for (const [index, harmony] of allHarmonies.entries()) {
          const x1 = index * hWidth;
          const x2 = currentNote * nWidth;
          currentNote += harmony.length;
          Canvas.drawBezierConnectorY(context, x1, y1n, x2, y2n);
        }
        // Draw notes
        rowY += rowHeight + gapHeight;
        for (const [index, note] of notes.entries()) {
          const col = index;
          const mX = col * nWidth;
          const bgColor = noteColors[note.pitch % 12];
          nRenderer.render(context, index, [note], mX, rowY, bgColor, {
            ...renderParams,
            showFrets: nWidthInner > 10,
          });
        }
      }
    }
    draw();
  };

  afterUpdate(drawVis);

  /**
   * Draws a funnel to indicate that horizontal span relates to another one below
   *
   * @todo move to mvlib, add X version
   * @param {CanvasRenderingContext2D} context canvas rendering context
   * @param {number} y1 top y position
   * @param {number} y2 bottom y position
   * @param {number} x1left top left x position
   * @param {number} x1right top right x position
   * @param {number} x2left bottom left x position
   * @param {number} x2right bottom right x position
   */
  function drawBezierFunnelY(
    context,
    y1,
    y2,
    x1left,
    x1right,
    x2left,
    x2right
  ) {
    const deltaY = (y2 - y1) / 2;
    context.beginPath();
    context.moveTo(x1left, y1);
    context.bezierCurveTo(x1left, y1 + deltaY, x2left, y1 + deltaY, x2left, y2);
    context.lineTo(x2right, y2);
    context.bezierCurveTo(
      x2right,
      y1 + deltaY,
      x1right,
      y1 + deltaY,
      x1right,
      y1
    );
    context.closePath();
    context.fill();
  }
</script>

<main style={`height: ${height}px`}>
  <div class="overviewTitle">Tree</div>
  <div class="control">
    <div>
      <label>
        Show harmonies and notes
        <input type="checkbox" bind:checked={showHarmoniesAndNotes} />
      </label>
    </div>
  </div>
  <canvas {width} height={height - 30} bind:this={canvas} />
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }

  .control {
    height: 26px;
    margin-bottom: 4px;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    justify-items: center;
    align-items: center;
  }
</style>
