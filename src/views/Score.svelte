<script>
  import * as opensheetmusicdisplay from "opensheetmusicdisplay";
  import * as d3 from "d3";
  import { delay, removeXmlElements } from "../lib.js";

  export let width;
  export let height;
  export let musicxml;
  export let trackIndex;
  export let colorMode = "bars";
  export let measures;
  export let measureColors;
  export let sectionInfo;
  export let sectionColors;
  export let selectedMeasure = null;

  let main;
  let container;
  let osmd;

  const measureOpacity = 0.4;
  const measureOpacityHighlighted = 0.8;

  // TODO: zoom does not work
  // const zoom = 0.5;
  const osmdScalingFactor = 10;
  const noteStaffHeight = 4;
  const tabStaffHeight = 6.6;

  let parsedXml;

  $: colors =
    colorMode === "bars"
      ? measureColors
      : sectionInfo.flatMap((section, index) =>
          new Array(section.endMeasure - section.startMeasure + 1).fill(
            sectionColors[index]
          )
        );

  const cleanXml = (stringXml) => {
    // Remove lyrics etc
    console.log("cleaning up XML");
    const parser = new DOMParser();
    parsedXml = parser.parseFromString(stringXml, "text/xml");
    const newXml = removeXmlElements(parsedXml, [
      "direction words",
      "note lyric",
      "dynamics",
    ]);
    const serializer = new XMLSerializer();
    return serializer.serializeToString(newXml);
  };

  const loadOSMD = async () => {
    if (!container || !musicxml || musicxml === "" || measures?.length === 0) {
      return;
    }
    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
    osmd.setOptions({
      autoResize: false,
      // autoResize: true,
      // backend: "canvas",
      backend: "svg",
      drawingParameters: "compacttight",
      drawLyrics: false,
      // renderSingleHorizontalStaffline: true,
      stretchLastSystemLine: true,
      autoGenerateMutipleRestMeasuresFromRestMeasures: false,
      onXMLRead: cleanXml,
    });
    // Set zoom
    // osmd.zoom = zoom;
    // osmd.Zoom = zoom;
    // Load
    console.log("osmd loading");
    await osmd.load(musicxml);
    console.log("osmd loaded");
  };

  const renderOSMD = async () => {
    if (!osmd) {
      return;
    }
    console.log(`osmd rendering track ${trackIndex}`);
    // Only show selected track
    // See https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo#part-selection-not-rendering-individual-partsinstruments
    for (let index = 0; index < osmd.sheet.Instruments.length; index++) {
      const isVisible = index === trackIndex;
      osmd.sheet.Instruments[index].Visible = isVisible;
    }
    // Render
    await osmd.render();
    console.log("osmd rendered");
  };

  /**
   * Hack to get the measure bounding boxes from OSMD.
   *
   * @param {object} osmd OSMD object
   * @returns {object[]} with {x, y, width, height}
   */
  const getMeasureInfo = (osmd) => {
    return osmd.graphic.measureList
      .map((measure) => {
        if (measure[0] === undefined) {
          return [{ x: 0, y: 0, width: 0, height: 0 }];
        }
        return measure
          .filter((d) => d.boundingBox.size.width > 0)
          .map((d) => {
            return {
              ...d.boundingBox.absolutePosition,
              ...d.boundingBox.size,
            };
          });
      })
      .map((d) => d[0]);
  };

  /**
   * Extracts statt details from XML to allow determining box heights
   */
  // const getStaffDetails = () => {
  //   const part = parsedXml.querySelectorAll("part")[trackIndex];
  //   const clefs = part.querySelectorAll("clef");
  //   const staffs = part.querySelectorAll("staff-details");
  //   const result = [];
  //   for (const [index, clef] of clefs.entries()) {
  //     const clefEl = clef.querySelectorAll("sign")[0];
  //     const staffLinesEl = staffs[index].querySelectorAll("staff-lines")[0];
  //     console.log(clefEl, staffLinesEl);
  //     result.push({
  //       sign: clefEl.textContent.toLowerCase(),
  //       staffLines: +staffLinesEl.textContent,
  //     });
  //   }
  //   console.log(result);
  //   return result;
  // };

  /**
   * Determines the staff type
   *
   * @returns {'notes'|'tab'|'notes-notes'|'notes-tab'}
   */
  const getStaffType = (parsedXml, trackIndex) => {
    const part = parsedXml.querySelectorAll("part")[trackIndex];
    const clefs = part.querySelectorAll("clef");
    const sign1 = clefs[0]
      .querySelectorAll("sign")[0]
      .textContent.toLowerCase();
    const type1 = sign1 === "tab" ? "tab" : "notes";
    if (clefs.length === 1) {
      return type1;
    } else {
      const sign2 = clefs[1]
        .querySelectorAll("sign")[0]
        .textContent.toLowerCase();
      const type2 = sign2 === "tab" ? "tab" : "notes";
      return `${type1}-${type2}`;
    }
  };

  const colorizeSvg = async () => {
    if (!osmd || !measureColors || measureColors.length === 0) {
      return;
    }
    console.log("osmd colorizing SVG");
    const svg = d3.select(container.getElementsByTagName("svg")[0]);
    // TODO: remove old rects or better: add when rendered and then only change later
    svg.selectAll(".coloredMeasure").remove();

    const measureInfo = getMeasureInfo(osmd);
    // console.log("measureInfo", measureInfo);
    // const staffs = getStaffDetails();
    const staffType = getStaffType(parsedXml, trackIndex);
    console.log("stafftype", staffType);

    for (const [index, measure] of measureInfo.entries()) {
      // Empty measures should be transparent
      if (measures[index].length === 0) {
        continue;
      }
      const x = measure.x * osmdScalingFactor;
      const y = measure.y * osmdScalingFactor;
      const w = measure.width * osmdScalingFactor;
      const color = colors[index];
      const onClick = () => (selectedMeasure = index);
      const m = osmd.graphic.measureList[index];
      // First staff
      const staffHeight1 =
        staffType === "tab" ? tabStaffHeight : noteStaffHeight;

      svg
        .append("rect")
        .attr("class", `coloredMeasure measure${index}`)
        .attr("x", x)
        .attr("y", y)
        .attr("width", w)
        .attr("height", staffHeight1 * osmdScalingFactor)
        .on("click", onClick)
        .transition()
        .style("fill", color)
        .style("opacity", measureOpacity)
        .style("mix-blend-mode", "multiply");
      if (m.length > 1) {
        const y2 = m[1].boundingBox.absolutePosition.y;
        const staffHeight2 =
          staffType === "notes-tab" ? tabStaffHeight : noteStaffHeight;
        if (y2 > 0) {
          // Second staff
          svg
            .append("rect")
            .attr("class", `coloredMeasure measure${index}`)
            .attr("x", x)
            .attr("y", y2 * osmdScalingFactor)
            .attr("width", w)
            .attr("height", staffHeight2 * osmdScalingFactor)
            .on("click", onClick)
            .transition()
            .style("fill", color)
            .style("opacity", measureOpacity)
            .style("mix-blend-mode", "multiply");
        }
        const yGap = (measure.y + staffHeight1) * osmdScalingFactor;
        const gapHeight = (y2 - measure.y - staffHeight1) * osmdScalingFactor;
        if (gapHeight > 0) {
          // Gap
          svg
            .append("rect")
            .attr("class", `coloredMeasure gap measure${index}`)
            .attr("x", x)
            .attr("y", yGap)
            .attr("width", w)
            .attr("height", gapHeight)
            .on("click", onClick)
            .transition()
            .style("fill", color)
            .style("opacity", measureOpacity)
            .style("mix-blend-mode", "multiply");
        }
      }
    }
  };

  /**
   * Scrolls the view such that the selected measure is at the top.
   * Only scrolls when measure is not already in view.
   *
   * @todo animate? https://gist.github.com/humbletim/5507619
   * @param {number} selectedMeasure measure index
   */
  const scrollToMeasure = (selectedMeasure) => {
    if (selectedMeasure === null || !osmd) {
      return;
    }
    // TODO: cache this in component state?
    const measureInfo = getMeasureInfo(osmd);
    const y = measureInfo[selectedMeasure].y;
    const py = (y + noteStaffHeight) * osmdScalingFactor - 60;
    const height = main.getBoundingClientRect().height;
    const top = main.scrollTop;
    if (py < top || py > top + height) {
      main.scrollTop = py;
    }
  };

  /**
   * Visually highlight a selected measure by applying more opacity
   *
   * @param {number} measureIndex measure index
   */
  const highlightMeasure = (measureIndex) => {
    // console.log(`Highlighting .measure${measureIndex}`);
    // Reset opacity of all measure backgrounds
    const measures = d3.select(container).selectAll(`.coloredMeasure`);
    measures.transition().style("opacity", measureOpacity);
    if (measureIndex !== undefined && measureIndex !== null) {
      // Highlight selected measure elements
      const measures2 = measures.filter(`.measure${measureIndex}`);
      measures2.transition().style("opacity", measureOpacityHighlighted);
    }
  };

  // Update depending on prop change
  $: if (true || musicxml || container) {
    loadOSMD();
  }
  $: if (true || width || osmd) {
    renderOSMD().then(() => delay(0.1).then(colorizeSvg));
  }
  $: if (true || colors) {
    colorizeSvg();
  }
  $: if (true || selectedMeasure) {
    scrollToMeasure(selectedMeasure);
    highlightMeasure(selectedMeasure);
  }
</script>

<main bind:this={main}>
  <div
    bind:this={container}
    style="width: {width - 25}px; height: {height}px"
  />
</main>

<style>
  main {
    overflow-y: scroll;
  }
</style>
