<script>
    import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
    import IconButton from "@smui/icon-button";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import { Label } from "@smui/common";

    import "svelte-material-ui/bare.css";
    import Menu from "./Menu.svelte";
    import OverviewSheet from "./OverviewSheet.svelte";
    import OverviewTree from "./OverviewTree.svelte";
    import {
        getColorsFrom1DPoints,
        getDistanceMatrix,
        getDRPointsFromDistances,
        getMeasures,
        getSectionInfo,
        getSections,
    } from "./lib.js";

    // View
    let views = ["Overview Sheet", "Tree", "Score"];
    let currentView = views[0];

    // Data
    let musicpiece = null;
    $: console.log("app: musicpiece", musicpiece);
    let track;
    $: console.log("app: track", track);
    let encoding;
    let coloring;
    let colormap;

    $: notes = track ? track.notes : [];
    $: measures = track ? getMeasures(track) : [];
    $: console.log(measures);
    $: measureDists = getDistanceMatrix(measures, "levenshteinPitch");
    $: measurePoints = getDRPointsFromDistances(measureDists);
    $: console.log("app: points", measurePoints);
    $: measureColors =
        measurePoints.length > 0 && colormap
            ? getColorsFrom1DPoints(measurePoints, colormap.map)
            : [];
    $: console.log("app: colors", measureColors);

    $: sectionInfo = track ? getSectionInfo(track) : null;
    $: console.log("app: secInfo", sectionInfo);
    $: sections = track ? getSections(sectionInfo, measures) : null;
    $: console.log("app: secs", sections);
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
                        singleSelect
                        let:segment
                        bind:selected={currentView}
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
                    on:fileopened={(event) =>
                        (musicpiece = event.detail.musicpiece)}
                    bind:selectedTrack={track}
                    bind:selectedEncoding={encoding}
                    bind:selectedColoring={coloring}
                    bind:selectedColormap={colormap}
                />
                <div class="views">
                    {#if notes && notes.length > 0}
                        <OverviewSheet
                            width={800}
                            height={800}
                            {track}
                            {measures}
                            {encoding}
                            mode={"Measures"}
                            colors={measureColors}
                        />
                    {/if}
                    {#if sections && sections.length > 0}
                        <OverviewTree
                            width={800}
                            height={600}
                            {track}
                            {sectionInfo}
                            {sections}
                            {measures}
                            {measureColors}
                            {encoding}
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
        grid-template-columns: 320px auto;
    }
</style>
