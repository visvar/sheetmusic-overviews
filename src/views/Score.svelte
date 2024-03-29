<script>
  import * as opensheetmusicdisplay from 'opensheetmusicdisplay';
  import * as d3 from 'd3';
  import { Utils } from 'musicvis-lib';
  import { removeXmlElements } from '../lib/lib.js';
  import { createPng } from '../lib/export.js';

  export let width;
  export let height;
  export let musicpiece;
  export let musicxml;
  export let trackIndex;
  export let colorMode = 'bars';
  export let measures;
  export let measureColors;
  export let sectionInfo;
  export let sectionColors;
  export let selectedMeasure = null;

  let main;
  let container;
  let osmd;
  let measureInfo;

  // color options
  let measureOpacity = 0.3;
  const measureOpacityHighlighted = 1;

  // layout
  let pageFormat = 'endless';
  let zoom = 0.8;
  const osmdScalingFactor = 10;
  const noteStaffHeight = 4;
  const tabStaffHeight = 6.6;

  let parsedXml;

  $: selectedXmlMeasure =
    selectedMeasure !== null
      ? musicpiece.xmlMeasureIndices[selectedMeasure]
      : null;

  $: colors =
    colorMode === 'bars'
      ? measureColors
      : sectionInfo.flatMap((section, index) =>
          new Array(section.endMeasure - section.startMeasure + 1).fill(
            sectionColors[index]
          )
        );

  /**
   * Removes certain things from the XML, e.g., lyrics
   * @todo cache
   * @param {string} stringXml MusicXML as string
   */
  const cleanXml = (stringXml) => {
    console.log('cleaning up XML');
    const parser = new DOMParser();
    parsedXml = parser.parseFromString(stringXml, 'text/xml');
    const newXml = removeXmlElements(parsedXml, [
      'direction words',
      'note lyric',
      'dynamics',
    ]);
    const serializer = new XMLSerializer();
    return serializer.serializeToString(newXml);
  };

  const loadOSMD = async () => {
    if (!container || !musicxml || musicxml === '' || measures?.length === 0) {
      return;
    }
    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
    osmd.setOptions({
      // autoResize: true,
      autoResize: false,
      // backend: 'canvas', // canvas does not work with colorign and PDF export
      backend: 'svg',
      drawingParameters: 'compacttight',
      // drawingParameters: 'compact',
      // drawingParameters: 'preview',
      drawTimeSignatures: true,
      drawMetronomeMarks: true,
      drawComposer: false,
      drawCredits: false,
      drawLyricist: false,
      drawTitle: false,
      drawSubtitle: false,
      drawLyrics: false,
      drawFingerings: false,
      drawPartNames: false,
      drawPartAbbreviations: false,
      // renderSingleHorizontalStaffline: true,
      stretchLastSystemLine: false,
      autoGenerateMutipleRestMeasuresFromRestMeasures: false,
      pageFormat, // 'A4_P', 'endless'
      pageBackgroundColor: 'white',
      onXMLRead: cleanXml,
    });
    // Load
    console.log('osmd loading');
    try {
      await osmd.load(musicxml);
      console.log('osmd loaded');
    } catch (e) {
      console.error(e);
      console.log(musicxml);
    }
  };

  /**
   * Hack to get the measure bounding boxes from OSMD.
   *
   * @param {object} osmd OSMD object
   * @returns {object[]} with {x, y, width, height}
   */
  const getMeasureInfo = (osmd) => {
    console.log('getting bar boxes');
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
   * Renders the current OSMD configuration
   */
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
    // Set zoom
    osmd.Zoom = zoom;
    // Render
    await osmd.render();
    measureInfo = getMeasureInfo(osmd);
    console.log('osmd rendered');
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
    const part = parsedXml.querySelectorAll('part')[trackIndex];
    const clefs = part.querySelectorAll('clef');
    const sign1 = clefs[0]
      .querySelectorAll('sign')[0]
      .textContent.toLowerCase();
    const type1 = sign1 === 'tab' ? 'tab' : 'notes';
    if (clefs.length === 1) {
      return type1;
    } else {
      const sign2 = clefs[1]
        .querySelectorAll('sign')[0]
        .textContent.toLowerCase();
      const type2 = sign2 === 'tab' ? 'tab' : 'notes';
      return `${type1}-${type2}`;
    }
  };

  const colorizeSvg = async () => {
    if (!osmd || !measureColors || measureColors.length === 0) {
      return;
    }
    console.log('osmd colorizing SVG');
    const svg = d3.select(container.getElementsByTagName('svg')[0]);
    // remove old rects
    svg.selectAll('.coloredMeasure').remove();

    // console.log("measureInfo", measureInfo);
    // const staffs = getStaffDetails();
    const staffType = getStaffType(parsedXml, trackIndex);
    console.log('stafftype', staffType);

    for (const [index, measure] of measureInfo.entries()) {
      const parsedMIndex = musicpiece.xmlMeasureIndices.indexOf(index);
      // Empty measures should be transparent
      if (measures[parsedMIndex]?.length === 0) {
        continue;
      }
      const x = measure.x * osmdScalingFactor;
      const y = measure.y * osmdScalingFactor;
      const w = measure.width * osmdScalingFactor;
      const color = colors[parsedMIndex];
      const onClick = () => (selectedMeasure = parsedMIndex);
      const m = osmd.graphic.measureList[index];
      const staffHeight1 =
        staffType === 'tab' ? tabStaffHeight : noteStaffHeight;

      let h = staffHeight1;
      if (
        m.length > 1 &&
        (staffType === 'notes-tab' || staffType === 'notes-notes')
      ) {
        const y2 = m[1].boundingBox.absolutePosition.y;
        const staffHeight2 =
          staffType === 'notes-tab' ? tabStaffHeight : noteStaffHeight;
        h += staffHeight2;
        const gapHeight = y2 - measure.y - staffHeight1;
        if (gapHeight > 0) {
          h += gapHeight;
        }
      }

      // First staff
      svg
        .append('rect')
        .attr('class', `coloredMeasure measure${index}`)
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h * osmdScalingFactor)
        .attr('rx', 3)
        .on('click', onClick)
        .transition()
        .style('fill', color)
        .style('stroke', 'black')
        .style('opacity', measureOpacity)
        .style('mix-blend-mode', 'multiply');
    }
  };

  /**
   * Updates zoom
   */
  const scale = () => {
    window.setTimeout(() => {
      osmd.Zoom = zoom;
      osmd.render();
    }, 0);
  };

  /**
   * Updates fixed bar width
   *
   * @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/pull/1368
   */
  const fixedWidth = (fixed = true) => {
    window.setTimeout(() => {
      osmd.EngravingRules.FixedMeasureWidth = fixed;
      osmd.EngravingRules.FixedMeasureWidthFixedValue = 40;
      osmd.EngravingRules.FixedMeasureWidthUseForPickupMeasures = true;
      osmd.EngravingRules.LastSystemMaxScalingFactor = 1;
      osmd.render();
    }, 0);
  };

  /**
   * Scrolls the view such that the selected measure is at the top.
   * Only scrolls when measure is not already in view.
   *
   * @todo animate? https://gist.github.com/humbletim/5507619
   * @param {number} measureIndex measure index
   */
  const scrollToMeasure = (measureIndex) => {
    if (measureIndex === null || !osmd) {
      return;
    }
    const y = measureInfo[measureIndex].y;
    // pixel y position
    const py = (y + noteStaffHeight) * osmdScalingFactor - 60;
    const height = main.getBoundingClientRect().height;
    const top = main.scrollTop;
    const bottom = top + height;
    if (py < top || py + 180 > bottom) {
      main.scrollTop = py - 150;
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
    measures
      .transition()
      .style('opacity', measureOpacity)
      .attr('stroke-width', 0);
    if (measureIndex !== undefined && measureIndex !== null) {
      // Highlight selected measure elements
      const measures2 = measures.filter(`.measure${measureIndex}`);
      measures2
        .transition()
        .style('opacity', measureOpacityHighlighted)
        .attr('stroke-width', 3);
    }
  };

  const reactToDataOrSizeChange = async () => {
    await renderOSMD();
    await Utils.delay(0.2);
    await osmd.render();
    await Utils.delay(0.2);
    measureInfo = getMeasureInfo(osmd);
    colorizeSvg();
  };

  // Update depending on prop change
  $: if (true || musicxml || container || trackIndex) {
    loadOSMD();
  }
  $: if (true || width || osmd) {
    reactToDataOrSizeChange();
  }
  $: if (true || colors) {
    colorizeSvg();
  }
  $: if (true || selectedXmlMeasure) {
    scrollToMeasure(selectedXmlMeasure);
    highlightMeasure(selectedXmlMeasure);
  }
</script>

<main bind:this="{main}">
  <div class="control">
    <label>
      <span>Color opacity</span>
      <input
        type="range"
        bind:value="{measureOpacity}"
        on:input="{() => highlightMeasure(selectedMeasure)}"
        min="{0}"
        max="{0.8}"
        step="{0.1}"
      />
    </label>
    <label>
      <span>Zoom</span>
      <select
        bind:value="{zoom}"
        on:change="{(e) => {
          zoom = +e.target.value;
          scale();
        }}"
      >
        {#each [0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2] as zoomLevel}
          <option value="{zoomLevel}">{zoomLevel * 100} %</option>
        {/each}
      </select>
    </label>
    <label>
      <input
        type="checkbox"
        on:change="{(e) => {
          fixedWidth(e.target.checked);
        }}"
      />
      <span>Fixed width</span>
    </label>
    <!-- TODO: export is broken -->
    <!-- <button on:click="{() => createPng(osmd, musicpiece.name)}">export</button> -->
    <!-- <button
      on:click="{() => {
        pageFormat = pageFormat === 'A4_P' ? 'endless' : 'A4_P';
        loadOSMD();
      }}">paged/endless</button
    > -->
  </div>
  <div
    bind:this="{container}"
    style="width: {width - 25}px; height: {height - 20}px"
  ></div>
</main>

<style>
  main {
    overflow-y: scroll;
  }

  .control {
    width: 96%;
    height: 30px;
    margin: 0 2% 5px 2%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    /* align-content: space-between; */
  }

  label {
    display: grid;
    grid-template-columns: max-content min-content;
    align-items: center;
    gap: 10px;
  }

  label span {
    width: max-content;
  }
</style>
