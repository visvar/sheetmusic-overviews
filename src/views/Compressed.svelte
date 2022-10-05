<script>
  import { afterUpdate } from "svelte";
  import * as d3 from "d3";
  import { Canvas, Utils, StringBased } from "musicvis-lib";

  export let width;
  export let height = 100;
  export let measures;
  export let measureDists;
  export let measureColors;
  export let selectedMeasure;

  let zoom = 1;
  let container;
  let canvas;
  let canvasHeight = height - 35;

  $: repeatedIndices = Utils.findRepeatedIndices(
    d3.range(0, measures.length),
    (a, b) => measureDists[a][b] === 0
  );
  $: hierarchy =
    StringBased.ImmediateRepetitionCompression.compress(repeatedIndices);
  $: blockWidth = hierarchy ? (width / (hierarchy.length + 1)) * zoom : 0;

  /**
   *
   * @param context
   * @param tree
   * @param x
   * @param y
   * @param blockWidth
   * @param colors
   */
  const drawTreeNode = (context, tree, x, y, blockWidth, colors) => {
    if (!tree) {
      return;
    }
    // This is a leaf
    const offset = blockWidth / 2;
    const height = 80;
    const scaleY = d3.scaleLinear().domain([1, 7]).range([0, height]);
    const noteHeight = scaleY(1) - scaleY(0);
    const noteHeight2 = 0.5 * noteHeight;
    if (tree.join) {
      for (const value of tree) {
        if (blockWidth > 20) {
          context.fillText(value, x + offset, y);
        }
        const notes = measures[value];
        // Draw measure
        context.save();
        const bgColor = notes.length === 0 ? "#f8f8f8" : colors[value];
        context.fillStyle = bgColor;
        context.fillRect(x + 1, y + 2, blockWidth - 2, height);
        // Draw notes
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.font = `7px sans-serif`;
        const scaleX = d3
          .scaleLinear()
          .domain([d3.min(notes, (d) => d.start), d3.max(notes, (d) => d.end)])
          .range([x + 1, x + blockWidth - 2]);
        const fn = Canvas.drawNoteTrapezoid;
        for (const note of notes) {
          const nx = scaleX(note.start);
          const ny = y + scaleY(note.string);
          const width = scaleX(note.end) - nx;
          context.fillStyle = "#333";
          if (Utils.getColorLightness(bgColor) < 50) {
            context.fillStyle = "#eee";
          }
          fn(context, nx, ny, width, noteHeight, noteHeight2);
          // Draw fret numbers
          // if (isTab && showFretsToggle) {
          context.fillStyle =
            Utils.getColorLightness(context.fillStyle) > 50 ? "black" : "white";
          context.fillText(note.fret, nx + 1, ny + noteHeight / 2 + 1);
          // }
        }
        context.restore();
        x += blockWidth;
      }
      return;
    }
    // This is not a leaf
    // Pre
    if (tree.pre) {
      drawTreeNode(context, tree.pre, x, y, blockWidth, colors);
      x += tree.pre.length * blockWidth;
    }
    // Repetition
    const treeWidth = tree.seq.length * blockWidth;
    context.fillText(`${tree.rep} x`, x + treeWidth / 2, y);
    Canvas.drawBracketH(context, x + 3, y + 5, treeWidth - 6, 5, true);
    drawTreeNode(context, tree.seq, x, y + 25, blockWidth, colors);

    // Post
    if (tree.post) {
      x += tree.seq.length * blockWidth;
      drawTreeNode(context, tree.post, x, y, blockWidth, colors);
    }
  };

  /**
   *
   * @param context
   * @param tree
   * @param blockWidth
   * @param colors
   */
  const drawTreeGraph = (context, tree, blockWidth = 30, colors) => {
    const w = tree.length * blockWidth + 10;
    const h = (tree.depth + 1) * 30 + 100;
    context.font = "13px sans-serif";
    context.textAlign = "center";

    // Reset
    context.fillStyle = "white";
    context.fillRect(0, 0, w, h);
    context.fillStyle = "black";

    // Draw tree
    const x = 10;
    const y = 10;
    drawTreeNode(context, tree, x, y, blockWidth, colors);
  };

  const drawVis = () => {
    // Canvas.setupCanvas(canvas);
    const context = canvas.getContext("2d");
    drawTreeGraph(context, hierarchy, blockWidth, measureColors);
  };

  const onClick = (event) => {
    event.preventDefault();
    const column = Math.floor(event.offsetX / blockWidth);
    const summary =
      StringBased.ImmediateRepetitionCompression.summary(hierarchy);
    selectedMeasure = summary[column];
  };

  /**
   * Scroll horizontally on mouse wheel interaction
   * @param event
   */
  const onMouseWheel = (event) => {
    container.scrollLeft += 2 * event.deltaY;
  };

  afterUpdate(drawVis);
</script>

<main style={`height: ${height}px`}>
  <div class="overviewTitle">Compressed</div>
  <div>
    <label>
      Zoom
      <input type="range" bind:value={zoom} min={1} max={20} step={1} />
      {zoom}x
    </label>
  </div>
  <div
    class="canvasContainer"
    style={`max-width: ${width}px`}
    bind:this={container}
  >
    <canvas
      width={width * zoom}
      height={canvasHeight}
      bind:this={canvas}
      on:click={onClick}
      on:mousewheel={onMouseWheel}
    />
  </div>
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }

  .canvasContainer {
    overflow-x: scroll;
  }
</style>
