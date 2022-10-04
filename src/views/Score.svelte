<script>
    import * as opensheetmusicdisplay from "opensheetmusicdisplay";
    import * as d3 from "d3";
    import { delay, setOpacity } from "../lib.js";

    export let width;
    export let height;
    export let musicxml;
    export let trackIndex;
    export let track;
    export let measures;
    export let measureColors;
    export let selectedMeasure = null;

    let main;
    let container;
    let osmd;

    const measureOpacity = 0.4;
    const measureOpacityHighlighted = 0.8;

    // TODO: zoom does not work
    // const zoom = 0.5;
    const osmdScalingFactor = 10;
    const osmdNoteStaffHeight = 4;

    const loadOSMD = async () => {
        if (
            !container ||
            !musicxml ||
            musicxml === "" ||
            measures?.length === 0
        ) {
            return;
        }
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
        osmd.setOptions({
            autoResize: false,
            // autoResize: true,
            // backend: "canvas",
            backend: "svg",
            drawingParameters: "compacttight",
            onXMLRead: (xml) => {
                // TODO: remove lyrics etc?
                // console.log(xml);
                // const parser = new DOMParser();
                // const parsed = parser.parseFromString(xml, "text/xml");
                // console.log(parsed);
                return xml;
            },
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

    const colorize = async () => {
        // if (!osmd || !measureColors?.length > 0) {
        //     return;
        // }
        // console.log("osmd colorizing");
        // let ctx = document
        //     .getElementById("osmdCanvasVexFlowBackendCanvas1")
        //     .getContext("2d");
        // const isTab = d3.some(track.notes, (d) => d.fret !== undefined);
        // const tabStaffHeight = isTab ? 6.6 : 4;
        // const measureInfo = getMeasureInfo(osmd);
        // console.log("measureInfo", measureInfo);
        // for (const [index, measure] of measureInfo.entries()) {
        //     const x = measure.x * osmdScalingFactor;
        //     const y = measure.y * osmdScalingFactor;
        //     const w = measure.width * osmdScalingFactor;
        //     // Empty measures should be transparent
        //     if (measures[index].length === 0) {
        //         continue;
        //     }
        //     // Add transparency
        //     const color = setOpacity(measureColors[index], 0.25);
        //     ctx.fillStyle = color;
        //     // Note Staff
        //     ctx.fillRect(x, y, w, osmdNoteStaffHeight * osmdScalingFactor);
        //     const m = osmd.graphic.measureList[index];
        //     if (m.length > 1) {
        //         const y2 = m[1].boundingBox.absolutePosition.y;
        //         // Tab Staff
        //         ctx.fillRect(
        //             x,
        //             y2 * osmdScalingFactor,
        //             w,
        //             tabStaffHeight * osmdScalingFactor
        //         );
        //         // Gap
        //         ctx.fillStyle = setOpacity(measureColors[index], 0.1);
        //         ctx.fillRect(
        //             x,
        //             (measure.y + osmdNoteStaffHeight) * osmdScalingFactor,
        //             w,
        //             (y2 - measure.y - osmdNoteStaffHeight) * osmdScalingFactor
        //         );
        //     }
        // }
    };

    const colorizeSvg = async () => {
        if (!osmd || !measureColors?.length > 0) {
            return;
        }
        console.log("osmd colorizing SVG");
        const isTab = d3.some(track.notes, (d) => d.fret !== undefined);
        const tabStaffHeight = isTab ? 6.6 : 4;

        const el = container.getElementsByTagName("svg")[0];
        let svg = d3.select(el);
        // TODO: remove old rects or better: add when rendered and then only change later
        svg.selectAll(".coloredMeasure").remove();

        const measureInfo = getMeasureInfo(osmd);
        console.log("measureInfo", measureInfo);
        for (const [index, measure] of measureInfo.entries()) {
            // Empty measures should be transparent
            if (measures[index].length === 0) {
                continue;
            }
            const x = measure.x * osmdScalingFactor;
            const y = measure.y * osmdScalingFactor;
            const w = measure.width * osmdScalingFactor;
            const color = measureColors[index];
            const onClick = () => (selectedMeasure = index);
            // Note Staff
            svg.append("rect")
                .attr("class", `coloredMeasure measure${index}`)
                .attr("x", x)
                .attr("y", y)
                .attr("width", w)
                .attr("height", osmdNoteStaffHeight * osmdScalingFactor)
                .style("fill", color)
                .style("opacity", measureOpacity)
                .style("mix-blend-mode", "multiply")
                .on("click", onClick);
            const m = osmd.graphic.measureList[index];
            if (m.length > 1) {
                const y2 = m[1].boundingBox.absolutePosition.y;
                if (y2 > 0) {
                    // Tab Staff
                    svg.append("rect")
                        .attr("class", `coloredMeasure measure${index}`)
                        .attr("x", x)
                        .attr("y", y2 * osmdScalingFactor)
                        .attr("width", w)
                        .attr("height", tabStaffHeight * osmdScalingFactor)
                        .style("fill", color)
                        .style("opacity", measureOpacity)
                        .style("mix-blend-mode", "multiply")
                        .on("click", onClick);
                }
                const yGap =
                    (measure.y + osmdNoteStaffHeight) * osmdScalingFactor;
                const gapHeight =
                    (y2 - measure.y - osmdNoteStaffHeight) * osmdScalingFactor;
                if (gapHeight > 0) {
                    // Gap
                    svg.append("rect")
                        .attr("class", `coloredMeasure gap measure${index}`)
                        .attr("x", x)
                        .attr("y", yGap)
                        .attr("width", w)
                        .attr("height", gapHeight)
                        .style("fill", measureColors[index])
                        .style("opacity", measureOpacity)
                        .style("mix-blend-mode", "multiply")
                        .on("click", onClick);
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
        const py = (y + osmdNoteStaffHeight) * osmdScalingFactor - 60;
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
        renderOSMD().then(delay(0.1).then(colorizeSvg));
    }
    $: if (true || measureColors) {
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
