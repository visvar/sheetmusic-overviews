<script>
    import { onMount, afterUpdate } from "svelte";
    import * as d3 from "d3";
    import {
        Canvas,
        Chords,
        Utils,
    } from "../node_modules/musicvis-lib/dist/musicvislib";

    export let width;
    export let height;
    export let track;
    export let measures;
    export let measureDists;
    export let selectedMeasure;
    export let colors;
    export let encoding;
    export let mode = "Measures";

    let mPerRow = 20;
    let showFrets = true;
    let showStrings = true;

    let canvas;

    const drawVis = () => {
        // Canvas.setupCanvas(canvas);
        const w = width;
        const h = height - 30;
        const isTab = encoding === "Tab";
        const context = canvas.getContext("2d");

        const mWidth = width / mPerRow;
        const mWidthInner = mWidth - 2;
        const mHeight = Math.floor(
            (h - 10) / Math.ceil(track.measureIndices.length / mPerRow)
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

        const measureOrSectMode = ["Measures", "Sections"].includes(mode);

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

        function draw() {
            // If a measure was selected, change colors to reflect distance to selected measure
            console.log(`sheet draw sel ${selectedMeasure}`);

            let cols;
            let dists;
            if (measureOrSectMode && selectedMeasure !== null) {
                // Distance of all measures to the currently selected one
                dists = measureDists[selectedMeasure];
                const distColorScale = d3
                    .scaleLinear()
                    .domain(d3.extent(dists))
                    .range([0, 1]);
                const chromScale = d3.interpolateBlues;
                const distColor = (dist) => chromScale(distColorScale(dist));
                cols = dists.map(distColor);
            } else if (mode === "Sections") {
                cols = sections.flatMap((section, index) =>
                    Array.from({
                        length: section.endMeasure - section.startMeasure + 1,
                    }).fill(sectionColors[index])
                );
            } else {
                cols = colors;
            }

            // Reset background
            context.fillStyle = "white";
            context.fillRect(0, 0, w, h);
            // Draw measures
            context.strokeStyle = "black";
            context.strokeWidth = 10;
            context.textBaseline = "middle";
            let currentChord = 0;
            for (const [index, measure] of measures.entries()) {
                const col = index % mPerRow;
                const row = Math.floor(index / mPerRow);
                const mX = col * mWidth;
                const mY = row * mHeight + 10;
                context.font = `9px sans-serif`;
                context.fillStyle = "#666";
                // Rehearsal / section name
                const rehearsal = track.measureRehearsalMap.get(index);
                if (rehearsal) {
                    context.fillText(rehearsal, mX, mY - 3.5);
                } else if (index % 5 === 0) {
                    // Measure number
                    context.fillText(index + 1, mX, mY - 3.5);
                }
                // Distance to selected
                if (selectedMeasure !== null) {
                    context.fillText(
                        dists[index],
                        mX + mWidthInner - 10,
                        mY - 3.5
                    );
                }
                // Background
                let bgColor;
                if (!measureOrSectMode || measure.length === 0) {
                    bgColor = "#f8f8f8";
                } else {
                    bgColor = cols[index];
                }
                context.fillStyle = bgColor;
                context.fillRect(mX, mY, mWidthInner, mHeightInner);
                if (measure.length === 0) {
                    continue;
                }
                const scaleX = d3
                    .scaleLinear()
                    .domain([
                        d3.min(measure, (d) => d.start),
                        d3.max(measure, (d) => d.end),
                        // measureTimes[index - 1] ?? 0,
                        // measureTimes[index]
                    ])
                    .range([mX, mX + mWidthInner]);
                // Draw strings
                if (isTab && showStrings) {
                    context.fillStyle =
                        mode === "Measures"
                            ? "rgba(0, 0, 0, 0.1)"
                            : "rgba(0, 0, 0, 0.05)";
                    for (let string = 1.5; string < 7; ++string) {
                        context.fillRect(
                            mX,
                            mY + scaleY(string),
                            mWidthInner,
                            1
                        );
                    }
                }

                // Draw notes
                const fn = Canvas.drawNoteTrapezoid;
                context.font = `7px sans-serif`;
                if (mode !== "Harmonies") {
                    for (const note of measure) {
                        const x = scaleX(note.start);
                        const y = mY + scaleY(isTab ? note.string : note.pitch);
                        const width = scaleX(note.end) - x;
                        context.fillStyle = "#333";
                        if (
                            measureOrSectMode &&
                            Utils.getColorLightness(bgColor) < 50
                        ) {
                            context.fillStyle = "#eee";
                        }
                        if (mode === "Notes") {
                            context.fillStyle = cols[note.pitch % 12];
                        }
                        fn(context, x, y, width, noteHeight, noteEndHeight);
                        // Draw fret numbers
                        if (isTab && showFrets) {
                            context.fillStyle =
                                Utils.getColorLightness(context.fillStyle) > 50
                                    ? "black"
                                    : "white";
                            context.fillText(
                                note.fret,
                                x + 1,
                                y + noteHeight / 2 + 1
                            );
                        }
                    }
                } else {
                    const chords = Chords.detectChordsByExactStart(measure);
                    for (const chord of chords) {
                        for (const note of chord) {
                            const x = scaleX(note.start);
                            const y =
                                mY + scaleY(isTab ? note.string : note.pitch);
                            const width = scaleX(note.end) - x;
                            context.fillStyle = cols[currentChord];
                            fn(context, x, y, width, noteHeight, noteEndHeight);
                            // Draw fret numbers
                            if (showFrets) {
                                context.fillStyle =
                                    Utils.getColorLightness(context.fillStyle) >
                                    50
                                        ? "black"
                                        : "white";
                                context.fillText(
                                    note.fret,
                                    x + 1,
                                    y + noteHeight / 2 + 1
                                );
                            }
                        }
                        currentChord++;
                    }
                }
            }
        }
        draw();
    };

    onMount(drawVis);
    afterUpdate(drawVis);
</script>

<main>
    <div>
        <input type="range" bind:value={mPerRow} min={1} max={100} step={1} />
    </div>
    <canvas {width} {height} bind:this={canvas} />
</main>
