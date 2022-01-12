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
    <Title id="fullscreen-title">About</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="fullscreen-content">
    <h3>Abstract</h3>
    <p>TODO: paper abstract, paper link, bibtex, link to website, ...</p>

    <h3>More Information</h3>
    <p>TODO: paper abstract, paper link, bibtex, link to website, ...</p>

    <h3>About Us</h3>
    <p>TODO: paper abstract, paper link, bibtex, link to website, ...</p>
  </Content>
</Dialog>
