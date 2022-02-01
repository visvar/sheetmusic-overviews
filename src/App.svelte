<script>
    import "svelte-material-ui/bare.css";

    import * as d3 from "d3";
    import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
    import IconButton from "@smui/icon-button";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import MainMenu from "@smui/menu";
    import { Anchor } from "@smui/menu-surface";
    import List, {
        Item,
        Separator,
        Text,
        PrimaryText,
        SecondaryText,
    } from "@smui/list";
    import { Label } from "@smui/button";
    import { Chords } from "../node_modules/musicvis-lib/dist/musicvislib";

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
    import Compressed from "./Compressed.svelte";
    import Score from "./Score.svelte";
    import Help from "./modals/Help.svelte";
    import About from "./modals/About.svelte";

    // Main menu
    let menu;
    let anchor;
    let anchorClasses = {};

    // View
    let views = ["Tree", "Compressed", "Sheet", "Score"];
    let currentViews = ["Tree", "Compressed", "Sheet"];

    // Data
    let musicxml = null;
    let musicpiece = null;
    $: console.log("app: musicpiece", musicpiece);
    // $: trackIndex = musicpiece ? 0 : 0;
    let trackIndex = 0;
    $: trackIndex = trackIndex === undefined ? 0 : trackIndex;
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
    // $: console.log("app: measure colors", measureColors);

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
    const treeHeight = 500;
    const compressedHeight = 200;
    $: sheetHeight = getSheetHeight(currentViews);

    const getSheetHeight = (currentViews) => {
        let height = contentHeight;
        if (currentViews.includes("Tree")) {
            height -= treeHeight + 20;
        }
        if (currentViews.includes("Compressed")) {
            height -= compressedHeight + 20;
        }
        console.log("new sheet height:", height);
        return height;
    };

    // Interaction
    let selectedSection = null;
    let selectedMeasure = null;
    let menuAction = "";

    // Modals
    let showHelp = false;
    let showAbout = false;
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
                    <div
                        class={Object.keys(anchorClasses).join(" ")}
                        use:Anchor={{
                            addClass: (className) => {
                                if (!anchorClasses[className]) {
                                    anchorClasses[className] = true;
                                }
                            },
                            removeClass: (className) => {
                                if (anchorClasses[className]) {
                                    delete anchorClasses[className];
                                    anchorClasses = anchorClasses;
                                }
                            },
                        }}
                        bind:this={anchor}
                    >
                        <IconButton
                            class="material-icons"
                            on:click={() => menu.setOpen(true)}>menu</IconButton
                        >
                        <MainMenu
                            bind:this={menu}
                            anchor={false}
                            bind:anchorElement={anchor}
                            anchorCorner="BOTTOM_LEFT"
                        >
                            <List twoLine>
                                <Item
                                    on:SMUI:action={() => (menuAction = "Cut")}
                                >
                                    <Text>
                                        <PrimaryText>Cut</PrimaryText>
                                        <SecondaryText>
                                            Copy to clipboard and remove.
                                        </SecondaryText>
                                    </Text>
                                </Item>
                                <Item
                                    on:SMUI:action={() => (menuAction = "Copy")}
                                >
                                    <Text>
                                        <PrimaryText>Copy</PrimaryText>
                                        <SecondaryText>
                                            Copy to clipboard.
                                        </SecondaryText>
                                    </Text>
                                </Item>
                                <Separator />
                                <Item
                                    on:SMUI:action={() =>
                                        (menuAction = "Delete")}
                                >
                                    <Text>
                                        <PrimaryText>Delete</PrimaryText>
                                        <SecondaryText>
                                            Remove item.
                                        </SecondaryText>
                                    </Text>
                                </Item>
                            </List>
                        </MainMenu>
                    </div>
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
                        on:click={() => (showAbout = true)}
                        class="material-icons">info</IconButton
                    >
                    <IconButton
                        on:click={() => (showHelp = true)}
                        class="material-icons">help</IconButton
                    >
                </Section>
            </Row>
        </TopAppBar>
        <div class="flexor-content">
            <main>
                <div class="sideBar">
                    <Menu
                        bind:musicxml
                        bind:musicpiece
                        bind:selectedTrack={trackIndex}
                        bind:selectedEncoding={encoding}
                        bind:selectedColoring={coloring}
                        bind:selectedColormap={colormap}
                    />
                    <div class="infoBar">
                        {#if selectedSection !== null}
                            <div>
                                Selected section: {selectedSection + 1}
                                {sectionInfo[selectedSection]?.name}
                            </div>
                        {/if}
                        {#if selectedMeasure !== null}
                            <div>
                                Selected measure: {selectedMeasure + 1}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="overviewContainer">
                    {#if currentViews.includes("Tree") && sections && sections.length > 0}
                        <OverviewTree
                            width={contentWidth / 2}
                            height={treeHeight}
                            {encoding}
                            {sectionInfo}
                            {sections}
                            {sectionColors}
                            bind:selectedSection
                            {measures}
                            {measureColors}
                            bind:selectedMeasure
                            {harmonyColors}
                            {noteColors}
                        />
                    {/if}
                    {#if currentViews.includes("Compressed") && notes && notes.length > 0}
                        <Compressed
                            width={contentWidth / 2}
                            height={compressedHeight}
                            {measures}
                            {measureDists}
                            {measureColors}
                        />
                    {/if}
                    {#if currentViews.includes("Sheet") && notes && notes.length > 0}
                        <OverviewSheet
                            width={contentWidth / 2}
                            height={sheetHeight}
                            {track}
                            {measures}
                            {measureDists}
                            bind:selectedMeasure
                            {encoding}
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
                            bind:selectedMeasure
                        />
                    {/if}
                </div>
            </main>
        </div>
    </div>
    <Help bind:open={showHelp} />
    <About bind:open={showAbout} />
</div>

<style>
    .top-app-bar-container {
        width: 100%;
        margin: 0;
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
        margin-top: 20px;
        margin-bottom: 0;
    }

    main {
        display: grid;
        grid-template-columns: 260px auto auto;
        gap: 25px;
    }

    .sideBar {
        padding-left: 15px;
    }

    .infoBar {
        margin-top: 20px;
    }

    .overviewContainer {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
    }
</style>
