<script>
  import Dialog, { Header, Title, Content } from "@smui/dialog";
  import IconButton from "@smui/icon-button";

  export let open = false;
</script>

<Dialog
  bind:open
  fullscreen
  aria-labelledby="fullscreen-title"
  aria-describedby="fullscreen-content"
>
  <Header>
    <Title id="fullscreen-title">Help</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="fullscreen-content">
    <h3>Getting Started</h3>
    <p>
      In order to use this app, you have to get a MusicXML file of your sheet
      music, for example by exporting from MuseScore or GuitarPro.
    </p>
    <p>
      Open a file using the button on the sidebar on the left. You can select a
      track via the dropdown below.
    </p>
    <p>You can change how colors are computed and mapped with options below.</p>

    <h3>Tracks</h3>
    <p>
      The Tracks view shows all tracks (usually, there is one for each
      instrument) in an overview. Colored rectangles indicate bars that contain
      notes. Clicking on a bar will highlight it in other views.
    </p>

    <h3>Tree</h3>
    <p>
      The Tree view shows the hierarchical structure, the rows display sections,
      measures, harmonies, and single notes. Click on an item to select it and
      only display its children in the row below.
    </p>

    <h3>Sheet</h3>
    <p>
      Click on a measure in the Sheet view to select it. Colors will now now
      indicate the similarity of other measures to it.
    </p>

    <h3>Score</h3>
    <p>
      The Score view shows sheet music as you will probably know it best. When
      selecting a measure in another view, the Score view will scroll to its
      position.
    </p>
  </Content>
</Dialog>
