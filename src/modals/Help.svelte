<script>
  import Dialog, { Header, Title, Content } from '@smui/dialog';
  import IconButton from '@smui/icon-button';

  export let open = false;
</script>

<Dialog
  bind:open
  fullscreen
  aria-labelledby="fullscreen-title"
  aria-describedby="fullscreen-content">
  <Header>
    <Title id="fullscreen-title">Help</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="fullscreen-content">
    <h3>Getting Started</h3>
    <p>
      In order to use this app, you have to get a <a
        href="https://www.musicxml.com/"
        target="_blank"
        rel="noreferrer">MusicXML</a>
      file of your sheet music, for example by exporting from
      <a href="https://musescore.com/" target="_blank" rel="noreferrer"
        >MuseScore</a>
      or
      <a href="https://www.guitar-pro.com/" target="_blank" rel="noreferrer"
        >GuitarPro</a
      >. Exporting only the instrument(s) you are interested in will improve
      performance.
    </p>
    <p>
      Open a file using the button on the sidebar on the left. You can select a
      track via the dropdown below.
    </p>

    <h3>Colors</h3>
    <p>
      You can change how colors are computed and mapped with options in the menu
      on the left.
    </p>

    <h3>Navigation</h3>
    <p>
      You can select a bar by clicking on it in any view. Using the left and
      right arrow keys on your keyboard, you can jump to the previous and next
      bar. Sections can be selected in the Tree view, or by using up and down
      arrow keys.
    </p>

    <h3>Player</h3>
    <p>
      You can play notes back as audio using the player. It will start at the
      currently selected bar and play until you stop it, the currently played
      bar will be highlighted in other parts of the app. The player has options
      for instrument and speed.
    </p>

    <h3>Tracks</h3>
    <p>
      The <i>Tracks</i> view shows all tracks (usually, there is one for each instrument)
      in an overview. Colored rectangles indicate bars that contain notes. Clicking
      on a bar will highlight it in other views.
    </p>

    <h3>Tree</h3>
    <p>
      The <i>Tree</i> view shows the hierarchical structure, the rows display sections,
      measures, harmonies, and single notes. Click on an item to select it and only
      display its children in the row below.
    </p>
    <p>
      The colors in each row are independent from those in other rows, they only
      show similarity within a row. Notes have their own color map that is not
      based on similarity.
    </p>

    <h3>Compact</h3>
    <p>
      Click on a measure in the <i>Compact</i> view to select it. Colors will now
      now indicate the similarity of other measures to it.
    </p>

    <h3>Score</h3>
    <p>
      The <i>Score</i> view shows sheet music as you will probably know it best.
      When selecting a measure in another view, the Score view will scroll to its
      position.
    </p>
  </Content>
</Dialog>
