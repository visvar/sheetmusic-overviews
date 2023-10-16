<script>
  import Dialog, { Header, Title, Content } from '@smui/dialog';
  import IconButton from '@smui/icon-button';

  export let open = false;
</script>

<Dialog
  bind:open="{open}"
  fullscreen
  aria-labelledby="fullscreen-title"
  aria-describedby="fullscreen-content"
>
  <Header>
    <Title id="fullscreen-title">About</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="fullscreen-content">
    <h3>Code and More</h3>

    <a
      href="https://github.com/visvar/sheetmusic-overviews"
      target="_blank"
      rel="noreferrer"
    >
      GitHub repository
    </a>

    <h3>ISMIR 2023 Paper</h3>
    <b>Visual Overviews for Sheet Music Structure</b>
    <p>Frank Heyen, Quynh Quang Ngo, Michael Sedlmair</p>
    <p>
      We propose different methods for alternative representation and visual
      augmentation of sheet music that help users gain an overview of general
      structure, repeating patterns, and the similarity of segments. To this
      end, we explored mapping the overall similarity between sections or bars
      to colors. For these mappings, we use dimensionality reduction or
      clustering to assign similar segments to similar colors and vice versa. To
      provide a better overview, we further designed simplified music notation
      representations, including hierarchical and compressed encodings. These
      overviews allow users to display whole pieces more compactly on a single
      screen without clutter and to find and navigate to distant segments more
      quickly. Our preliminary evaluation with guitarists and tablature shows
      that our design supports users in tasks such as analyzing structure,
      finding repetitions, and determining the similarity of specific segments
      to others.
    </p>

    <h3>About Us</h3>
    <a href="https://visvar.github.io/" target="_blank" rel="noreferrer">
      VISVAR research group website
    </a>

    <h3>Acknowledgements</h3>
    <p>
      <li>
        <a
          href="https://opensheetmusicdisplay.org/"
          target="_blank"
          rel="noreferrer"
        >
          Open Sheet Music Display
        </a> for rendering
      </li>
      <!-- <li>
        <a href="https://alphatab.net/" target="_blank" rel="noreferrer">
        alphaTab
        </a> for rendering
      </li> -->
      <li>
        <a href="https://d3js.org/" target="_blank" rel="noreferrer"> D3 </a> for
        spatial and chromatic scales
      </li>
      <li>
        <a href="https://svelte.dev/" target="_blank" rel="noreferrer">
          Svelte
        </a> for app components and state management
      </li>
      <li>
        <a
          href="https://github.com/saehm/DruidJS"
          target="_blank"
          rel="noreferrer"
        >
          DruidJS
        </a> for dimensionality reduction and clustering
      </li>
      <li>
        <a
          href="https://github.com/fheyen/musicvis-lib"
          target="_blank"
          rel="noreferrer"
        >
          musicvis-lib
        </a> for computing similarities, compression, and more
      </li>
    </p>
  </Content>
</Dialog>
