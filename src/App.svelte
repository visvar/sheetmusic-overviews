<script>
  import 'svelte-material-ui/bare.css';

  import * as d3 from 'd3';
  import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
  import IconButton from '@smui/icon-button';
  import Button, { Label } from '@smui/button';
  import { Chords, Note } from 'musicvis-lib';

  import {
    getDistanceMatrix,
    getColorsViaClusteringFromDistances,
    getColorsViaCompression,
    getColorsViaMDSFromDistances,
    getColorsViaOccurence,
  } from './lib/lib.js';

  import Menu from './Menu.svelte';
  import Tracks from './views/Tracks.svelte';
  import Tree from './views/Tree.svelte';
  import Compact from './views/Compact.svelte';
  import Compressed from './views/Compressed.svelte';
  import Score from './views/Score.svelte';
  import Help from './modals/Help.svelte';
  import About from './modals/About.svelte';
  import Player from './Player.svelte';
  import Tab from './views/Tab.svelte';

  // View
  let views = ['Tracks', 'Tree', 'Compressed', 'Compact', 'Score', 'Tab'];
  let currentViews = new Set([...views]);
  // let currentViews = new Set(['Tracks', 'Compact', 'Tab']);

  // Data
  let musicxml = null;
  let musicpiece = null;
  $: console.log('app: musicpiece', musicpiece);
  let trackIndex = 0;
  $: trackIndex = trackIndex === undefined ? 0 : trackIndex;
  $: track = musicpiece ? musicpiece.tracks[trackIndex] : null;
  $: console.log('app: track', trackIndex, track);
  let encoding;
  let metric;
  let coloring;
  let clusterThreshold;
  let compressionDepth = 2;
  let colorMode;
  let colormap;

  // Notes
  $: notes = track ? track.notes : [];

  // Bars
  $: measures = track ? track.getMeasures(Note.startPitchComparator) : [];
  $: measureDists = metric ? getDistanceMatrix(measures, metric.value) : [];
  let measureColors;
  $: {
    if (coloring === 'DR') {
      measureColors = getColorsViaMDSFromDistances(measureDists, colormap?.map);
    } else if (coloring === 'Clustering') {
      measureColors = getColorsViaClusteringFromDistances(
        measureDists,
        colormap?.map,
        clusterThreshold
      );
    } else if (coloring === 'Compression') {
      measureColors = getColorsViaCompression(
        measureDists,
        colormap?.map,
        compressionDepth
      );
    } else if (coloring === 'Occurence') {
      measureColors = getColorsViaOccurence(measureDists, colormap?.map);
    }
  }

  // Sections
  $: sectionInfo = track ? track.getSectionInfo() : null;
  $: console.log('app: secInfo', sectionInfo);
  $: sections = track
    ? track.getSections(Note.startPitchComparator, sectionInfo, measures)
    : [];
  $: sectionDists = metric ? getDistanceMatrix(sections, metric.value) : [];
  let sectionColors;
  $: {
    if (coloring === 'DR') {
      sectionColors = getColorsViaMDSFromDistances(sectionDists, colormap?.map);
    } else if (coloring === 'Clustering') {
      sectionColors = getColorsViaClusteringFromDistances(
        sectionDists,
        colormap?.map,
        clusterThreshold
      );
    } else if (coloring === 'Compression') {
      sectionColors = getColorsViaCompression(
        sectionDists,
        colormap?.map,
        compressionDepth
      );
    } else if (coloring === 'Occurence') {
      sectionColors = getColorsViaOccurence(sectionDists, colormap?.map);
    }
  }

  // Harmonies
  $: harmonies = Chords.detectChordsByExactStart(notes);
  $: harmonyDists = getDistanceMatrix(harmonies, 'jaccardPitch');
  $: harmonyColors =
    coloring === 'DR'
      ? getColorsViaMDSFromDistances(harmonyDists, colormap?.map)
      : getColorsViaClusteringFromDistances(
          harmonyDists,
          colormap?.map,
          clusterThreshold
        );

  $: noteColors = colormap
    ? d3.range(0, 12).map((d) => '' + colormap.map(d / 12))
    : d3.range(12).fill('white');

  // Sizes without nav and menu
  let windowWidth;
  let windowHeight;
  $: viewWidth =
    currentViews.has('Score') && currentViews.size > 1
      ? (windowWidth - 340) / 2
      : windowWidth - 320;
  $: contentHeight = windowHeight - 125;
  $: tracksHeight = (musicpiece?.tracks.length ?? 0.1) * 14 + 40;
  const treeHeight = 400;
  const compressedHeight = 200;
  $: compactSheetHeight = getSheetHeight(currentViews, contentHeight);
  $: onlyScoreShown = currentViews.has('Score') && currentViews.size === 1;

  const getSheetHeight = (currentViews, contentHeight, gap = 40) => {
    let height = contentHeight - 40;
    if (currentViews.has('Tracks')) {
      height -= tracksHeight + gap;
    }
    if (currentViews.has('Tree')) {
      height -= treeHeight + gap;
    }
    if (currentViews.has('Compressed')) {
      height -= compressedHeight + gap;
    }
    return height;
  };

  // Interaction
  let selectedSection = null;
  let selectedMeasure = null;

  // Modals
  let showHelp = false;
  let showAbout = false;

  // Keyboard input
  const handleKeydown = (event) => {
    console.log(event);
    if (event.code === 'ArrowRight') {
      // Next measure
      event.preventDefault();
      selectedMeasure = Math.min((selectedMeasure ?? 0) + 1, measures.length);
    } else if (event.code === 'ArrowLeft') {
      // previous measure
      event.preventDefault();
      selectedMeasure = Math.max((selectedMeasure ?? 0) - 1, 0);
    } else if (event.code === 'ArrowDown') {
      // Next section
      event.preventDefault();
      selectedSection = Math.min((selectedSection ?? 0) + 1, sections.length);
      selectedMeasure = sectionInfo[selectedSection].startMeasure;
    } else if (event.code === 'ArrowUp') {
      // Previous section
      event.preventDefault();
      selectedSection = Math.max((selectedSection ?? 0) - 1, 0);
      selectedMeasure = sectionInfo[selectedSection].startMeasure;
    }
  };
</script>

<svelte:window
  bind:innerWidth="{windowWidth}"
  bind:innerHeight="{windowHeight}"
  on:keydown="{handleKeydown}"
/>

<div class="flexy">
  <div
    class="top-app-bar-container flexor"
    style="{`height:${window.innerHeight}px`}"
  >
    <TopAppBar
      variant="static"
      prominent="{false}"
      dense="{true}"
      color="primary"
    >
      <Row>
        <Section>
          <Title>Sheet Music Overviews</Title>
        </Section>

        <!-- View buttons -->
        <Section toolbar>
          {#each views as view}
            <Button
              on:click="{() => {
                currentViews.has(view)
                  ? currentViews.delete(view)
                  : currentViews.add(view);
                currentViews = new Set(currentViews);
              }}"
            >
              <div style="opacity: {currentViews.has(view) ? 1 : 0.5}">
                <Label>{view}</Label>
              </div>
            </Button>
          {/each}
        </Section>

        <!-- Player -->
        <Section toolbar>
          <Player
            musicpiece="{musicpiece}"
            trackIndex="{trackIndex}"
            selectedSection="{selectedSection}"
            bind:selectedMeasure="{selectedMeasure}"
          />
        </Section>

        <!-- Info and help modal butons -->
        <Section align="end" toolbar>
          <!-- <IconButton
            on:click={() => (showAbout = true)}
            class="material-icons"
          >
            info
          </IconButton> -->
          <IconButton
            on:click="{() => (showHelp = true)}"
            class="material-icons"
          >
            help
          </IconButton>
        </Section>
      </Row>
    </TopAppBar>
    <div class="flexor-content">
      <main>
        <div class="sideBar">
          <Menu
            bind:musicxml="{musicxml}"
            bind:musicpiece="{musicpiece}"
            bind:selectedTrack="{trackIndex}"
            bind:selectedSection="{selectedSection}"
            bind:selectedMeasure="{selectedMeasure}"
            bind:selectedEncoding="{encoding}"
            bind:selectedMetric="{metric}"
            bind:selectedColoring="{coloring}"
            bind:clusterThreshold="{clusterThreshold}"
            bind:compressionDepth="{compressionDepth}"
            bind:selectedColorMode="{colorMode}"
            bind:selectedColormap="{colormap}"
            sectionInfo="{sectionInfo}"
          />
        </div>
        <div class="overviewContainer">
          {#if currentViews.has('Tracks') && musicpiece}
            <Tracks
              width="{viewWidth}"
              height="{tracksHeight}"
              musicpiece="{musicpiece}"
              sectionInfo="{sectionInfo}"
              bind:selectedMeasure="{selectedMeasure}"
              bind:selectedSection="{selectedSection}"
            />
          {/if}
          {#if currentViews.has('Tree') && sections && sections.length > 0}
            <Tree
              width="{viewWidth}"
              height="{treeHeight}"
              encoding="{encoding}"
              sectionInfo="{sectionInfo}"
              sections="{sections}"
              sectionColors="{sectionColors}"
              bind:selectedSection="{selectedSection}"
              measures="{measures}"
              measureColors="{measureColors}"
              bind:selectedMeasure="{selectedMeasure}"
              harmonyColors="{harmonyColors}"
              noteColors="{noteColors}"
            />
          {/if}
          {#if currentViews.has('Compressed') && notes && notes.length > 0}
            <Compressed
              width="{viewWidth}"
              height="{compressedHeight}"
              encoding="{encoding}"
              measures="{measures}"
              measureDists="{measureDists}"
              measureColors="{measureColors}"
              bind:selectedMeasure="{selectedMeasure}"
            />
          {/if}
          {#if currentViews.has('Compact') && notes && notes.length > 0}
            <Compact
              width="{viewWidth}"
              height="{compactSheetHeight}"
              track="{track}"
              colorMode="{colorMode}"
              measures="{measures}"
              measureTimes="{musicpiece.measureTimes}"
              measureDists="{measureDists}"
              bind:selectedMeasure="{selectedMeasure}"
              encoding="{encoding}"
              colors="{measureColors}"
              sectionInfo="{sectionInfo}"
              sectionColors="{sectionColors}"
            />
          {/if}
        </div>
        <div class="scoreContainer">
          {#if currentViews.has('Tab')}
            <Tab
              width="{viewWidth}"
              height="{contentHeight}"
              musicpiece="{musicpiece}"
              musicxml="{musicxml}"
              trackIndex="{trackIndex}"
              colorMode="{colorMode}"
              measures="{measures}"
              measureColors="{measureColors}"
              sectionInfo="{sectionInfo}"
              sectionColors="{sectionColors}"
              bind:selectedMeasure="{selectedMeasure}"
            />
          {/if}
          {#if currentViews.has('Score') && musicxml && musicpiece && track && measureColors.length > 0}
            <Score
              width="{viewWidth}"
              height="{contentHeight}"
              musicpiece="{musicpiece}"
              musicxml="{musicxml}"
              trackIndex="{trackIndex}"
              colorMode="{colorMode}"
              measures="{measures}"
              measureColors="{measureColors}"
              sectionInfo="{sectionInfo}"
              sectionColors="{sectionColors}"
              bind:selectedMeasure="{selectedMeasure}"
            />
          {/if}
        </div>
      </main>
    </div>
  </div>
  <About bind:open="{showAbout}" />
  <Help bind:open="{showHelp}" />
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
    min-width: 1500px;
    display: grid;
    grid-template-columns: 260px auto auto;
    gap: 25px;
  }

  .sideBar {
    padding-left: 15px;
  }

  .overviewContainer {
    padding: 5px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    justify-items: start;
  }
</style>
