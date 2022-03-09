<script>
  import * as d3 from "d3";
  import Player from "./lib/Player.js";
  import { Utils } from "musicvis-lib";
  import IconButton from "@smui/icon-button";
  import SelectMenuSingle from "./ui/SelectMenuSingle.svelte";

  export let musicpiece;
  export let trackIndex = 0;
  export let selectedMeasure = 0;

  let speed = 1;
  let loop = false;
  let endAt = -1;

  let currentPlayerTime = null;
  let isPlaying = false;

  const p = new Player()
    .onTimeChange((t) => {
      currentPlayerTime = t;
    })
    .onStop(() => {
      isPlaying = false;
      currentPlayerTime = null;
    })
    .setVolume(3)
    .setLogging(true);

  let instruments = p.getAvailableInstruments();
  let instrument = "acoustic_grand_piano";
  $: if (instrument) {
    p.preloadInstrument(instrument);
  }

  const handlePlayButton = () => {
    if (!isPlaying) {
      if (!currentPlayerTime) {
        // Start from beginning
        const notes = musicpiece.getNotesFromTracks(trackIndex);
        // Start at selected measure
        const startMeasure = selectedMeasure ?? 0;
        const startAt =
          startMeasure > 0 ? musicpiece.measureTimes[startMeasure - 1] : 0;
        p.playNotes(notes, instrument, startAt, endAt, speed, loop);
      } else {
        // Resume
        p.resume();
      }
      isPlaying = true;
    } else {
      // Pause
      p.pause();
      isPlaying = false;
    }
  };
</script>

<main>
  <!-- Play/pause, stop, and loop button -->
  <IconButton on:click={handlePlayButton} class="material-icons">
    {isPlaying ? "pause" : "play_arrow"}
  </IconButton>
  <IconButton on:click={() => p.stop()} class="material-icons">stop</IconButton>

  <!-- Time indicator -->
  <span class="time">
    {Utils.formatTime(currentPlayerTime, false)}
  </span>

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
    font-family: monospace;
  }
</style>
