<script>
    import "svelte-material-ui/bare.css";

    import * as d3 from "d3";
    import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
    import IconButton from "@smui/icon-button";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import { Label } from "@smui/common";

    import {
        getColorsFrom1DPoints,
        getDistanceMatrix,
        getDRPointsFromDistances,
        getMeasures,
        getSectionInfo,
        getSections,
    } from "./lib.js";

    import Menu from "./Menu.svelte";
    import OverviewSheet from "./OverviewSheet.svelte";
    import OverviewTree from "./OverviewTree.svelte";
    import Score from "./Score.svelte";
    import { Chords } from "../node_modules/musicvis-lib/dist/musicvislib";

    // View
    let views = ["Sheet", "Tree", "Score"];
    let currentViews = ["Sheet", "Tree"];

    // Data
    let musicxml = null;
    let musicpiece = null;
    $: console.log("app: musicpiece", musicpiece);
    $: trackIndex = musicpiece ? 0 : 0;
    $: track = musicpiece ? musicpiece.tracks[trackIndex] : null;
    $: console.log("app: track", trackIndex, track);
    let encoding;
    let coloring;
    let colormap;

    // Notes and measures
    $: notes = track ? track.notes : [];
    $: measures = track ? getMeasures(track) : [];
    $: measureDists = getDistanceMatrix(measures, "levenshteinPitch");
    $: measurePoints = getDRPointsFromDistances(measureDists);
    $: measureColors = getColorsFrom1DPoints(measurePoints, colormap?.map);
    $: console.log("app: measure colors", measureColors);

    // Sections
    $: sectionInfo = track ? getSectionInfo(track) : null;
    $: console.log("app: secInfo", sectionInfo);
    $: sections = track ? getSections(sectionInfo, measures) : [];
    $: sectionDists = getDistanceMatrix(sections, "levenshteinPitch");
    $: sectionPoints = getDRPointsFromDistances(sectionDists);
    $: sectionColors = getColorsFrom1DPoints(sectionPoints, colormap?.map);
    // $: console.log("app: sec colors", sectionColors);

    // Harmonies
    $: harmonies = Chords.detectChordsByExactStart(notes);
    // $: console.log("app: harm", harmonies);
    $: harmonyDists = getDistanceMatrix(harmonies, "jaccardPitch");
    $: harmonyPoints = getDRPointsFromDistances(harmonyDists);
    $: harmonyColors = getColorsFrom1DPoints(harmonyPoints, colormap?.map);

    $: noteColors = colormap
        ? d3.range(0, 12).map((d) => "" + colormap.map(d / 12))
        : d3.range(12).fill("white");

    // Sizes without nav and menu
    $: contentWidth = window.innerWidth - 340;
    $: contentHeight = window.innerHeight - 80;

    // Interaction
    let selectedMeasure = null;
    $: console.log("app: selectedMeasure", selectedMeasure);
</script>

<div class="flexy">
    <div
        class="top-app-bar-container flexor"
        style={`height:${window.innerHeight}px`}
    >
        <TopAppBar
            variant="static"
            prominent={false}
            dense={true}
            color="primary"
        >
            <Row>
                <Section>
                    <IconButton class="material-icons">menu</IconButton>
                    <Title>Sheet Music Overviews</Title>
                </Section>
                <Section align="center" toolbar>
                    <SegmentedButton
                        segments={views}
                        let:segment
                        bind:selected={currentViews}
                    >
                        <Segment {segment}>
                            <Label>{segment}</Label>
                        </Segment>
                    </SegmentedButton>
                </Section>
                <Section align="end" toolbar>
                    <IconButton
                        class="material-icons"
                        aria-label="Bookmark this page">bookmark</IconButton
                    >
                </Section>
            </Row>
        </TopAppBar>
        <div class="flexor-content">
            <main>
                <Menu
                    on:fileopened={(event) => {
                        console.log(event.detail);
                        musicxml = event.detail.musicxml;
                        musicpiece = event.detail.musicpiece;
                    }}
                    bind:selectedTrack={trackIndex}
                    bind:selectedEncoding={encoding}
                    bind:selectedColoring={coloring}
                    bind:selectedColormap={colormap}
                />
                <div class="overviewContainer">
                    {#if currentViews.includes("Tree") && sections && sections.length > 0}
                        <OverviewTree
                            width={contentWidth / 2}
                            height={600}
                            {encoding}
                            {sectionInfo}
                            {sections}
                            {sectionColors}
                            {measures}
                            {measureColors}
                            {harmonyColors}
                            {noteColors}
                        />
                    {/if}
                    {#if currentViews.includes("Sheet") && notes && notes.length > 0}
                        <OverviewSheet
                            width={contentWidth / 2}
                            height={contentHeight - 600}
                            {track}
                            {measures}
                            {measureDists}
                            bind:selectedMeasure
                            {encoding}
                            mode={"Measures"}
                            colors={measureColors}
                        />
                    {/if}
                </div>
                <div class="scoreContainer">
                    {#if currentViews.includes("Score") && musicxml && musicpiece && track && measureColors.length > 0}
                        <Score
                            width={contentWidth / 2}
                            height={contentHeight}
                            {musicxml}
                            {trackIndex}
                            {track}
                            {measures}
                            {measureColors}
                            {selectedMeasure}
                        />
                    {/if}
                </div>
            </main>
        </div>
    </div>
</div>

<style>
    .top-app-bar-container {
        width: 100%;
        margin: 0 0 0 0;
        overflow: auto;
        display: inline-block;
        background-color: var(--mdc-theme-background, #fff);
    }

    @media (max-width: 480px) {
        .top-app-bar-container {
            margin-right: 0;
        }
    }

    .flexy {
        display: flex;
        flex-wrap: wrap;
    }

    .flexor {
        display: inline-flex;
        flex-direction: column;
    }

    .flexor-content {
        flex-basis: 0;
        flex-grow: 1;
        overflow: auto;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    main {
        display: grid;
        grid-template-columns: 320px auto auto;
        gap: 10px;
    }
</style>
