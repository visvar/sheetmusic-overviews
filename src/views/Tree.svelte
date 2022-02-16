<script>
  import { afterUpdate } from "svelte";
  import * as d3 from "d3";
  import {
    Canvas,
    Chords,
    Utils,
  } from "../../node_modules/musicvis-lib/dist/musicvislib";
  // import { Canvas, Utils, Chords } from "musicvis-lib/dist/musicvislib";

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

  let showNotes = true;

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

  const drawVerticalText = (
    context,
    x,
    y,
    text,
    color,
    size,
    centered = false
  ) => {
    context.save();
    context.rotate((90 * Math.PI) / 180);
    if (centered) {
      context.textAlign = "center";
    }
    context.fillStyle = color;
    context.font = `${size}px sans-serif`;
    context.fillText(text, y, -x);
    context.restore();
  };

  const drawVis = () => {
    // Canvas.setupCanvas(canvas);
    const marginLeft = 15;
    const w = width - marginLeft;
    const levelHeight = Math.floor((height - 20) / 7);
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
      const isTab = encoding === "Tab" || encoding === "Tab (simple)";

      // Get filtered data
      currMeasures = measures;
      if (selectedSection !== null) {
        const { startMeasure, endMeasure } = sectionInfo[selectedSection];
        currMeasures = measures.slice(startMeasure, endMeasure + 1);
      }
      allHarmonies = Chords.detectChordsByExactStart(currMeasures.flat());
      if (selectedMeasure !== null) {
        allHarmonies = Chords.detectChordsByExactStart(
          currMeasures[selectedMeasureOfSection]
        );
      }
      notes = allHarmonies.flat();

      // Config
      const drawFn = Canvas.drawNoteTrapezoid;
      const pitchExtent = d3.extent(notes, (d) => d.pitch);
      const noteHeight = isTab
        ? rowHeight / 6
        : rowHeight / (pitchExtent[1] - pitchExtent[0]);
      let scaleY;
      if (isTab) {
        scaleY = d3.scaleLinear().domain([1, 7]).range([0, rowHeight]);
      } else {
        scaleY = d3
          .scaleLinear()
          .domain([pitchExtent[0] - 1, pitchExtent[1] + 1])
          .range([rowHeight, 0]);
      }

      // Reset
      context.resetTransform();
      context.imageSmoothingQuality = "high";
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);

      // Draw labels for rows
      let y = 10 + rowHeight / 2;
      for (const label of ["Sections", "Measures", "Harmnonies", "Notes"]) {
        drawVerticalText(context, 0, y, label, "#333", 13, true);
        y += rowHeight * 2;
      }
      context.translate(marginLeft, 0);

      // Draw sections
      sWidth = w / sections.length;
      const sWidthInner = sWidth > 3 ? sWidth - 0.5 : sWidth;
      let rowY = 10;
      for (const [index, section] of sections.entries()) {
        const col = index;
        const mX = col * sWidth;
        // Background
        const bgColor =
          sectionColors.length < 2 ? "#f8f8f8" : sectionColors[index];
        context.fillStyle = bgColor;
        context.fillRect(mX, rowY, sWidthInner, rowHeight);
        if (selectedSection !== null && index !== selectedSection) {
          // Fade not-selected sections
          context.fillStyle = "rgba(255, 255, 255, 0.7)";
          context.fillRect(mX, rowY, sWidthInner, rowHeight);
        }
        const scaleX = d3
          .scaleLinear()
          .domain([
            d3.min(section, (d) => d.start),
            d3.max(section, (d) => d.end),
          ])
          .range([mX, mX + sWidthInner]);
        // Section name
        context.fillStyle = "white";
        context.fillRect(mX - 5, rowY - 10, w, 10);
        context.fillStyle = "black";
        context.fillText(sectionInfo[index].name, mX, rowY - 2);
        // Draw notes
        context.fillStyle =
          Utils.getColorLightness(bgColor) > 50 ? "black" : "white";
        if (showNotes) {
          for (const note of section) {
            const x = scaleX(note.start);
            const y = rowY + scaleY(isTab ? note.string : note.pitch);
            const width = scaleX(note.end) - x;
            drawFn(context, x, y, width, noteHeight, 0);
          }
        }
      }

      // Measures
      mWidth = w / currMeasures.length;
      const mWidthInner = mWidth > 3 ? mWidth - 0.5 : mWidth;
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
        Canvas.drawBezierConnectorY(context, x1, y1, 0, y2);
        const x1b = (selectedSection + 1) * sWidth;
        Canvas.drawBezierConnectorY(context, x1b, y1, w, y2);
      }
      // Draw measures
      rowY += rowHeight + gapHeight;
      for (const [index, measure] of currMeasures.entries()) {
        const col = index;
        const mX = col * mWidth;
        // Background
        context.fillStyle =
          measure.length === 0 ? "#f8f8f8" : measureColors[index];
        context.fillRect(mX, rowY, mWidthInner, rowHeight);
        if (
          selectedMeasureOfSection !== null &&
          index !== selectedMeasureOfSection
        ) {
          // Fade not-selected
          context.fillStyle = "rgba(255, 255, 255, 0.7)";
          context.fillRect(mX, rowY, mWidthInner, rowHeight);
        }
        const scaleX = d3
          .scaleLinear()
          .domain([
            d3.min(measure, (d) => d.start),
            d3.max(measure, (d) => d.end),
          ])
          .range([mX, mX + mWidthInner]);
        // Draw notes
        if (showNotes) {
          context.fillStyle =
            Utils.getColorLightness(context.fillStyle) > 50 ? "black" : "white";
          for (const note of measure) {
            const x = scaleX(note.start);
            const y = rowY + scaleY(isTab ? note.string : note.pitch);
            const width = scaleX(note.end) - x;
            drawFn(context, x, y, width, noteHeight, 0);
          }
        }
      }

      // Harmonies
      hWidth = w / allHarmonies.length;
      const hWidthInner = hWidth > 3 ? hWidth - 0.5 : hWidth;
      // Connection measures-harmonies
      const y1h = rowY + rowHeight;
      const y2h = y1h + gapHeight;
      if (selectedMeasure === null) {
        let currentHarmony = 0;
        for (const [index, measure] of currMeasures.entries()) {
          const harmmoniesOfMeasure = Chords.detectChordsByExactStart(measure);
          const x1 = index * mWidth;
          const x2 = currentHarmony * hWidth;
          currentHarmony += harmmoniesOfMeasure.length;
          Canvas.drawBezierConnectorY(context, x1, y1h, x2, y2h);
        }
      } else {
        const x1 = selectedMeasureOfSection * mWidth;
        Canvas.drawBezierConnectorY(context, x1, y1h, 0, y2h);
        const x1b = (selectedMeasureOfSection + 1) * mWidth;
        Canvas.drawBezierConnectorY(context, x1b, y1h, w, y2h);
      }

      // Draw harmonies
      rowY += rowHeight + gapHeight;
      for (const [index, chord] of allHarmonies.entries()) {
        const col = index;
        const mX = col * hWidth;
        context.fillStyle = harmonyColors[index];
        context.fillRect(mX, rowY, hWidthInner, rowHeight);
        // Draw notes
        if (showNotes) {
          context.fillStyle =
            Utils.getColorLightness(context.fillStyle) > 50 ? "black" : "white";
          for (const note of chord) {
            const y = rowY + scaleY(isTab ? note.string : note.pitch);
            drawFn(context, mX, y, hWidthInner, noteHeight, 0);
          }
        }
      }

      // Notes
      nWidth = w / notes.length;
      const nWidthInner = nWidth > 3 ? nWidth - 0.5 : nWidth;
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
        context.fillStyle = noteColors[note.pitch % 12];
        context.fillRect(mX, rowY, nWidthInner, rowHeight);
        if (showNotes) {
          context.fillStyle =
            Utils.getColorLightness(context.fillStyle) > 50 ? "black" : "white";
          const y = rowY + scaleY(isTab ? note.string : note.pitch);
          drawFn(context, mX, y, nWidthInner, noteHeight, 0);
        }
      }
    }
    draw();
  };

  afterUpdate(drawVis);
</script>

<main style={`height: ${height}px`}>
  <div class="overviewTitle">Tree</div>
  <canvas {width} {height} bind:this={canvas} />
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }
</style>
