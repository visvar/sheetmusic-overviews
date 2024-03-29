<script>
  import * as d3 from "d3";
  import Player from "./lib/Player.js";
  import { Utils } from "musicvis-lib";
  import IconButton from "@smui/icon-button";
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import SelectMenuSingle from "./ui/SelectMenuSingle.svelte";

  export let musicpiece;
  export let trackIndex = 0;
  export let selectedMeasure = 0;
  export let selectedSection = 0;

  let speed = 1;
  let loop = false;
  let endAt = -1;
  let logging = false;

  let currentPlayerTime = null;

  const updateCurrentMeasure = (time) => {
    currentPlayerTime = time;
    if (time === null) {
      return;
    }
    // Find current measure
    // let currentMeasure = selectedMeasure;
    let currentMeasure = 0;
    const times = musicpiece.measureTimes;
    while (time >= times[currentMeasure]) {
      currentMeasure++;
    }
    // Update state
    selectedMeasure = currentMeasure;
  };

  const player = new Player()
    .onTimeChange(updateCurrentMeasure)
    .onStop(() => {
      currentPlayerTime = null;
    })
    .setVolume(3)
    .setLogging(logging);

  let instruments = player.getAvailableInstruments();
  let instrument = "acoustic_grand_piano";
  $: if (instrument) {
    player.preloadInstrument(instrument);
  }

  $: startMeasure = selectedMeasure ?? 0;
  $: startAt = startMeasure > 0 ? musicpiece.measureTimes[startMeasure - 1] : 0;

  const handlePlayButton = () => {
    // Start from beginning
    const notes = musicpiece.getNotesFromTracks(trackIndex);
    // Start at selected measure
    player.playNotes(notes, instrument, startAt, endAt, speed, loop);
  };

  const handleKeydown = (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (currentPlayerTime === null) {
        handlePlayButton();
      } else {
        player.stop();
      }
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
  <!-- Play and stop button -->
  <IconButton on:click={handlePlayButton} class="material-icons">
    play_arrow
  </IconButton>
  <IconButton on:click={() => player.stop()} class="material-icons">
    stop
  </IconButton>

  <!-- Section, bar, and time indicator -->
  <Wrapper>
    <span class="time">
      S {(selectedSection ?? 0) + 1} &nbsp; B {(selectedMeasure ?? 0) + 1} &nbsp;
      {Utils.formatTime(currentPlayerTime ?? startAt, false)}
    </span>
    <Tooltip unbounded>Current section, bar, and time</Tooltip>
  </Wrapper>

  <!-- Instrument selection -->
  <SelectMenuSingle items={instruments} bind:value={instrument} icon="piano" />

  <!-- Speed selection -->
  <SelectMenuSingle
    items={d3.range(0.1, 2.1, 0.1).map((d) => {
      return { value: d, label: Math.round(d * 100) + "%" };
    })}
    bind:value={speed}
    icon="speed"
  />
</main>

<style>
  main {
    display: grid;
    grid-template-columns: repeat(6, auto);
    align-items: center;
  }

  .time {
    user-select: none;
    font-family: monospace;
  }
</style>
