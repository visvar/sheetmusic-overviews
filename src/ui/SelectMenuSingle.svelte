<script>
  import IconButton, { Icon } from "@smui/icon-button";
  import MainMenu from "@smui/menu";
  import { Anchor } from "@smui/menu-surface";
  import List, { Item, Text } from "@smui/list";

  /**
   * @typedef {object} item menu item
   * @property {*} value value
   * @property {string} label label
   * @example <caption>Example for menu item</caption>
   *      { value: 1, label: "One" }
   */

  /**
   * @type {item[]}
   */
  export let items;
  export let value;
  export let icon = "menu";

  let menu;
  let anchor;
  let anchorClasses = {};
</script>

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
  <IconButton class="material-icons" on:click={() => menu.setOpen(true)}>
    {icon}
  </IconButton>
  <MainMenu
    bind:this={menu}
    anchor={false}
    bind:anchorElement={anchor}
    anchorCorner="BOTTOM_LEFT"
  >
    <List>
      {#each items as { value: itemValue, label }}
        <Item on:SMUI:action={() => (value = itemValue)}>
          <Icon class="material-icons">
            {itemValue === value
              ? "radio_button_checked"
              : "radio_button_unchecked"}
          </Icon>
          <div class="spacer" />
          <Text>
            {label}
          </Text>
        </Item>
      {/each}
    </List>
  </MainMenu>
</div>

<style>
  .spacer {
    width: 5px;
  }
</style>
