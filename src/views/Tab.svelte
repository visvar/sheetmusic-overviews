<script>
  // @ts-nocheck

  import * as d3 from 'd3';
  import { formatDuration, removeXmlElements } from '../lib/lib.js';
  import { Utils } from 'musicvis-lib';
  import * as alphaTab from '@coderline/alphatab';
  import { onMount } from 'svelte';

  export let width;
  export let height;
  export let musicpiece;
  export let musicxml;
  export let trackIndex;
  export let colorMode = 'bars';
  export let measures;
  export let measureColors;
  export let sectionInfo;
  export let sectionColors;
  export let selectedMeasure = null;

  let api;
  let main;

  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('Menu: emptied musicpiece');
      return;
    }
    // Reset only now that there is valid file, to avoid user mistakes
    const n = file.name;
    if (n.endsWith('.gp') || n.endsWith('.gp5')) {
      const binary = await file.arrayBuffer();
      const data = new Uint8Array(binary);
      const settings = new alphaTab.Settings();
      const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
        data,
        settings
      );
      // TODO:
      console.log(score);

      api.renderScore(score, [trackIndex]);
      console.log(api);
      colorizeBars();
    } else {
      alert('Invalid file');
      return;
    }
  };

  const renderXml = async () => {
    // convert to binary first for alphatab
    const binary = new Blob([musicxml]);
    const data = new Uint8Array(await binary.arrayBuffer());
    const settings = new alphaTab.Settings();
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
      data,
      settings
    );
    api.renderScore(score, [trackIndex]);
  };

  onMount(() => {
    const wrapper = document.querySelector('.at-wrap');
    main = wrapper.querySelector('.at-main');

    const settings = {
      // settings see https://www.alphatab.net/docs/reference/settings
      file: 'https://www.alphatab.net/files/canon.gp',
      core: {
        fontDirectory: './alphatabFont/',
        // enableLazyLoading: false, // https://next.alphatab.net/docs/reference/settings/core/enablelazyloading/
      },
      // tracks: [0] // https://www.alphatab.net/docs/reference/settings/core/tracks/
      scale: 0.9, // https://www.alphatab.net/docs/reference/settings/display/scale/
      staveProfile: 'scoretab', // https://www.alphatab.net/docs/reference/settings/display/staveprofile/
      layoutMode: 'page', // https://www.alphatab.net/docs/reference/settings/display/layoutmode/
      displayMode: 'GuitarPro',
      display: {
        // barsPerRow: 4, // https://www.alphatab.net/docs/reference/settings/display/barsperrow/
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

    // overlay logic
    const overlay = wrapper.querySelector('.at-overlay');
    api.renderStarted.on(() => {
      overlay.style.display = 'flex';
    });
    api.renderFinished.on(() => {
      overlay.style.display = 'none';
    });

    // track selector
    function createTrackItem(track) {
      const trackItem = document
        .querySelector('#at-track-template')
        .content.cloneNode(true).firstElementChild;
      trackItem.querySelector('.at-track-name').innerText = track.name;
      trackItem.track = track;
      trackItem.onclick = (e) => {
        e.stopPropagation();
        api.renderTracks([track]);
      };
      return trackItem;
    }
    const trackList = wrapper.querySelector('.at-track-list');
    api.scoreLoaded.on((score) => {
      console.log('Score was loaded!', score);
      // clear items
      trackList.innerHTML = '';
      // generate a track item for all tracks of the score
      score.tracks.forEach((track) => {
        trackList.appendChild(createTrackItem(track));
      });
    });
    api.renderStarted.on(() => {
      console.log('rendering');

      // collect tracks being rendered
      const tracks = new Map();
      api.tracks.forEach((t) => {
        tracks.set(t.index, t);
      });
      // mark the item as active or not
      const trackItems = trackList.querySelectorAll('.at-track');
      trackItems.forEach((trackItem) => {
        if (tracks.has(trackItem.track.index)) {
          trackItem.classList.add('active');
        } else {
          trackItem.classList.remove('active');
        }
      });
    });

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
      console.log(args.activeBeats);
      console.log('player bar', args.activeBeats[0].voice.bar.index);
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
  tab
  <input
    type="file"
    accept=".xml,.musicxml,.mxl,.gp,.gp5"
    on:input="{handleFileInput}"
  />
  <button on:click="{renderXml}">use musicxml</button>
  <div class="at-wrap" style="width: {width - 25}px; height: {height - 50}px">
    <div class="at-controls">
      <span class="btn at-player-stop disabled"> reset </span>
      <span class="btn at-player-play-pause disabled"> play/pause </span>
      <div class="at-song-position">00:00 / 00:00</div>
      <span class="btn toggle at-count-in">count-in</span>
      <span class="btn at-metronome">metronome</span>
      <span class="btn at-loop">loop</span>
      <!-- <span class="btn at-print">print</span> -->
      <div class="at-mode">
        mode:
        <select>
          <option value="scoretab">scoretab</option>
          <option value="tab">tab</option>
          <option value="score">score</option>
        </select>
      </div>
      <div class="at-zoom">
        zoom:
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
    <div class="at-overlay">
      <div class="at-overlay-content">Music sheet is loading</div>
    </div>
    <div class="at-content">
      <div class="at-sidebar">
        <div class="at-sidebar-content">
          <div class="at-track-list"></div>
        </div>
      </div>
      <div class="at-viewport">
        <div class="at-main"></div>
      </div>
    </div>
  </div>

  <template id="at-track-template">
    <div class="at-track">
      <div class="at-track-details">
        <div class="at-track-name"></div>
      </div>
    </div>
  </template>
</main>

<style>
  .at-main {
    min-width: 200px;
  }

  .at-wrap {
    height: 80vh;
    margin: 0 auto;
    border: 1px solid rgba(0, 0, 0, 0.12);
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

  /** Sidebar **/
  .at-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    max-width: 70px;
    width: auto;
    display: flex;
    align-content: stretch;
    z-index: 1001;
    overflow: hidden;
  }

  .at-sidebar:hover {
    max-width: 400px;
    transition: max-width 0.2s;
    overflow-y: auto;
  }

  .at-viewport {
    overflow-y: auto;
    position: absolute;
    top: 0;
    left: 70px;
    right: 0;
    bottom: 0;
    padding-right: 20px;
  }

  /** Overlay **/

  .at-overlay {
    /** Fill Parent */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1002;

    /* Blurry dark shade */
    backdrop-filter: blur(3px);
    background: rgba(0, 0, 0, 0.5);

    /** center content */
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .at-overlay-content {
    /* white box with drop-shadow */
    margin-top: 20px;
    background: #fff;
    box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.3);
    padding: 10px;
  }

  /** Footer **/
  .at-controls {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    background: #eee;
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

  .at-controls .btn {
    border-radius: 3px;
    margin: 5px;
    padding: 2px 5px;
    font-size: 16px;
    background: #ddd;
    cursor: pointer;
  }
  .at-controls .btn.disabled {
    cursor: progress;
    opacity: 0.5;
  }

  .at-controls select {
    appearance: none;
    border: none;
    width: 100%;
    font-size: 16px;
    text-align-last: center;
    text-align: center;
    cursor: pointer;
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
