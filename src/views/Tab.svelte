<script>
  // @ts-nocheck

  import * as d3 from 'd3';
  import { formatDuration } from '../lib/lib.js';
  import * as alphaTab from '@coderline/alphatab';
  import { onMount, afterUpdate } from 'svelte';

  export let width;
  export let height;
  export let musicpiece;
  export let musicxml;
  export let alphaTabScore;
  export let trackIndex;
  export let colorMode = 'bars';
  export let measures;
  export let measureColors;
  export let sectionInfo;
  export let sectionColors;
  export let selectedMeasure = null;

  let api;
  let main;

  $: {
    if (api && alphaTabScore) {
      api.renderScore(alphaTabScore, [trackIndex]);
    }
  }

  onMount(() => {
    const wrapper = document.querySelector('.at-wrap');
    main = wrapper.querySelector('.at-main');

    const settings = {
      // settings see https://www.alphatab.net/docs/reference/settings
      // file: 'https://www.alphatab.net/files/canon.gp',
      core: {
        fontDirectory: './alphatabFont/',
        enableLazyLoading: false, // https://next.alphatab.net/docs/reference/settings/core/enablelazyloading/
      },
      // tracks: [0] // https://www.alphatab.net/docs/reference/settings/core/tracks/
      scale: 0.9, // https://www.alphatab.net/docs/reference/settings/display/scale/
      staveProfile: 'scoretab', // https://www.alphatab.net/docs/reference/settings/display/staveprofile/
      layoutMode: 'page', // https://www.alphatab.net/docs/reference/settings/display/layoutmode/
      displayMode: 'GuitarPro',
      display: {
        // barsPerRow: 4, // https://www.alphatab.net/docs/reference/settings/display/barsperrow/
        barCountPerPartial: 10000, // https://www.alphatab.net/docs/reference/settings/display/barcountperpartial/
      },
      notation: {
        elements: {
          // https://www.alphatab.net/docs/reference/settings/notation/elements/
          scoreTitle: false,
          scoreSubTitle: false,
          scoreArtist: false,
          scoreAlbum: false,
          scoreWords: false,
          scoreMusic: false,
          scoreWordsAndMusic: false,
          scoreCopyright: false,
          // guitarTuning: true,
          guitarTuning: false,
          trackNames: false,
        },
      },
      player: {
        enablePlayer: true,
        soundFont:
          'https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2',
        scrollElement: wrapper.querySelector('.at-viewport'),
      },
    };

    api = new alphaTab.AlphaTabApi(main, settings);

    /** Controls **/
    const countIn = wrapper.querySelector('.at-controls .at-count-in');
    countIn.onclick = () => {
      countIn.classList.toggle('active');
      if (countIn.classList.contains('active')) {
        api.countInVolume = 1;
      } else {
        api.countInVolume = 0;
      }
    };

    const metronome = wrapper.querySelector('.at-controls .at-metronome');
    metronome.onclick = () => {
      metronome.classList.toggle('active');
      if (metronome.classList.contains('active')) {
        api.metronomeVolume = 1;
      } else {
        api.metronomeVolume = 0;
      }
    };

    const loop = wrapper.querySelector('.at-controls .at-loop');
    loop.onclick = () => {
      loop.classList.toggle('active');
      api.isLooping = loop.classList.contains('active');
    };

    // wrapper.querySelector('.at-controls .at-print').onclick = () => {
    //   api.print();
    // };

    const mode = wrapper.querySelector('.at-controls .at-mode select');
    mode.onchange = () => {
      api.settings.display.staveProfile = mode.value;
      api.updateSettings();
      api.render();
    };
    const zoom = wrapper.querySelector('.at-controls .at-zoom select');
    zoom.onchange = () => {
      const zoomLevel = parseInt(zoom.value) / 100;
      api.settings.display.scale = zoomLevel;
      api.updateSettings();
      api.render();
    };

    // main player controls
    const playPause = wrapper.querySelector(
      '.at-controls .at-player-play-pause'
    );
    playPause.onclick = (e) => {
      if (e.target.classList.contains('disabled')) {
        return;
      }
      api.playPause();
    };
    const stop = wrapper.querySelector('.at-controls .at-player-stop');
    stop.onclick = (e) => {
      if (e.target.classList.contains('disabled')) {
        return;
      }
      api.stop();
    };
    api.playerReady.on(() => {
      playPause.classList.remove('disabled');
      stop.classList.remove('disabled');
    });
    api.playerStateChanged.on((e) => {
      if (e.state === alphaTab.synth.PlayerState.Playing) {
        console.log('playing');
      } else {
        console.log('paused');
      }
    });

    const songPosition = wrapper.querySelector('.at-song-position');
    let previousTime = -1;
    api.playerPositionChanged.on((e) => {
      // reduce number of UI updates to second changes.
      const currentSeconds = (e.currentTime / 1000) | 0;
      if (currentSeconds == previousTime) {
        return;
      }
      songPosition.innerText =
        formatDuration(e.currentTime) + ' / ' + formatDuration(e.endTime);
    });

    api.playedBeatChanged.on((beat) => {
      console.log('player beat', beat);
    });

    api.activeBeatsChanged.on((args) => {
      // console.log(args.activeBeats);
      // console.log('player bar', args.activeBeats[0].voice.bar.index);
      selectedMeasure = args.activeBeats[0].voice.bar.index;
    });
  });

  const colorizeBars = () => {
    const divs = main.querySelectorAll('div:not([class])');
    const svgs = main.querySelectorAll('svg');
    // https://next.alphatab.net/docs/reference/scorerenderer/boundslookup/
    const staveGroups = api.renderer.boundsLookup.staveGroups;
    console.log({ divs, svgs, staveGroups });
    console.log([...divs].slice(3));

    const barBBoxes = staveGroups.map((d) => d.bars);
    console.log(barBBoxes);

    const barBBoxes2 = d3.group(
      staveGroups.flatMap((d) => d.bars),
      (d) => d.index
    );
    console.log(barBBoxes2);
    // for (const [key, value] of barBBoxes) {

    // }
  };
</script>

<main>
  <div class="at-wrap" style="width: {width - 25}px; height: {height}px">
    <div class="at-controls">
      <button class="btn at-player-stop disabled"> reset </button>
      <button class="btn at-player-play-pause disabled"> play/pause </button>
      <div class="at-song-position">00:00 / 00:00</div>
      <button class="btn toggle at-count-in">count-in</button>
      <button class="btn at-metronome">metronome</button>
      <button class="btn at-loop">loop</button>
      <div class="at-mode">
        mode
        <select>
          <option value="scoretab">scoretab</option>
          <option value="tab">tab</option>
          <option value="score">score</option>
        </select>
      </div>
      <div class="at-zoom">
        zoom
        <select>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="90" selected>90%</option>
          <option value="100">100%</option>
          <option value="110">110%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
        </select>
      </div>
    </div>
    <div class="at-content">
      <div class="at-viewport">
        <div class="at-main"></div>
      </div>
    </div>
  </div>
</main>

<style>
  .at-main {
    min-width: 200px;
  }

  .at-wrap {
    height: 90vh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .at-content {
    position: relative;
    overflow: hidden;
    flex: 1 1 auto;
  }

  .at-viewport {
    overflow-y: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding-right: 10px;
  }

  /** controls **/
  .at-controls {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    padding: 3px;
  }

  .at-controls > div {
    display: flex;
    align-content: center;
    align-items: center;
  }

  .at-controls > div > * {
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px;
    margin: 0 3px;
  }

  .at-controls select {
    appearance: none;
    width: 100%;
    font-size: 16px;
    text-align-last: center;
    text-align: center;
  }

  :global(.at-cursor-bar) {
    /* Defines the color of the bar background when a bar is played */
    background: rgba(255, 242, 0, 0.25);
  }

  :global(.at-selection div) {
    /* Defines the color of the selection background */
    background: rgba(64, 64, 255, 0.1);
  }

  :global(.at-cursor-beat) {
    /* Defines the beat cursor */
    background: rgba(64, 64, 255, 0.75);
    width: 3px;
  }

  :global(.at-highlight) * {
    /* Defines the color of the music symbols when they are being played (svg) */
    fill: #0078ff;
    stroke: #0078ff;
  }
</style>
