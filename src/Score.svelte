<script>
    import { onMount, afterUpdate } from "svelte";
    import * as opensheetmusicdisplay from "opensheetmusicdisplay";
    import * as d3 from "d3";
    import { delay } from "./lib.js";

    export let musicxml;
    export let trackIndex;
    export let track;
    export let measureColors;

    let container;

    const drawVis = async () => {
        if (!musicxml || musicxml === "") {
            return;
        }
        // console.log(container);
        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
        osmd.setOptions({
            autoResize: false,
            backend: "canvas",
            drawingParameters: "compacttight",
        });

        // Load
        await osmd.load(musicxml);
        console.log("osmd loaded");

        // Only show selected track
        // See https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo#part-selection-not-rendering-individual-partsinstruments
        for (let index = 0; index < osmd.sheet.Instruments.length; index++) {
            const isVisible = index === trackIndex;
            osmd.sheet.Instruments[index].Visible = isVisible;
        }

        // Render
        await osmd.render();
        console.log("osmd rendered");

        // Colorize measures
        await delay(0.1);
        colorize(osmd);
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

    const colorize = async (osmd) => {
        console.log("osmd colorizing");
        const isTab = d3.some(track.notes, (d) => d.fret !== undefined);
        console.log("is tab?", isTab);

        const factor = 10;
        const noteStaffHeight = 4;
        const tabStaffHeight = isTab ? 6.6 : 4;

        const ctx = document
            .getElementById("osmdCanvasVexFlowBackendCanvas1")
            .getContext("2d");

        const measureInfo = getMeasureInfo(osmd);
        for (const [index, measure] of measureInfo.entries()) {
            const x = measure.x * factor;
            const y = measure.y * factor;
            const w = measure.width * factor;

            // Empty measures should be transparent
            if (notesByMeasure[index].length === 0) {
                continue;
            }
            // Add transparency
            const color = `rgba${measureColors[index].slice(3, -1)}, 0.25)`;
            ctx.fillStyle = color;

            // Note Staff
            ctx.fillRect(x, y, w, noteStaffHeight * factor);
            const m = osmd.graphic.measureList[index];
            if (m.length > 1) {
                const y2 = m[1].boundingBox.absolutePosition.y;
                // Tab Staff
                ctx.fillRect(x, y2 * factor, w, tabStaffHeight * factor);
                // Gap
                const color2 = `rgba${measureColors[index].slice(3, -1)}, 0.1)`;
                ctx.fillStyle = color2;
                ctx.fillRect(
                    x,
                    (measure.y + noteStaffHeight) * factor,
                    w,
                    (y2 - measure.y - noteStaffHeight) * factor
                );
            }
        }
    };

    // onMount(drawVis);
    afterUpdate(drawVis);
</script>

<main>
    <div bind:this={container} />
</main>

<style>
    div {
        width: 800px;
        max-width: 800px;
        max-height: calc(1vh -60px);
        overflow-y: scroll;
    }
</style>
