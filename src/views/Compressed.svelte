<script>
  import { afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { Canvas, Utils, StringBased } from 'musicvis-lib';
  import BarRenderer from '../lib/BarRenderer';

  export let width;
  export let height = 100;
  export let encoding;
  export let measures;
  export let measureDists;
  export let measureColors;
  export let selectedMeasure;

  let zoom = 1;
  let container;
  let canvas;
  let canvasHeight = height - 35;
  const barHeight = 80;

  $: repeatedIndices = Utils.findRepeatedIndices(
    d3.range(0, measures.length),
    (a, b) => measureDists[a][b] === 0
  );
  $: hierarchy =
    StringBased.ImmediateRepetitionCompression.compress(repeatedIndices);
  $: blockWidth = hierarchy ? (width / (hierarchy.length + 1)) * zoom : 0;

  /**
   * Draws the compressed tree
   * @param {object} tree hierarchy tree
   * @param {number} blockWidth with of a bar
   * @param {string[]} colors bar colors
   */
  const drawTreeGraph = (tree, blockWidth = 30, colors) => {
    // Canvas.setupCanvas(canvas);
    const context = canvas.getContext('2d');
    const w = tree.length * blockWidth + 10;
    const h = (tree.depth + 1) * 30 + 100;
    context.font = '12px sans-serif';
    context.textAlign = 'center';

    // Reset
    context.fillStyle = 'white';
    context.fillRect(0, 0, w, h);
    context.fillStyle = 'black';

    // Setup renderer
    const renderer = new BarRenderer(
      encoding,
      measures.flat(),
      blockWidth - 2,
      barHeight
    );

    // Draw tree
    const x = 10;
    const y = 10;
    drawTreeNode(context, tree, x, y, blockWidth, colors, renderer);
  };

  /**
   *
   * @param context
   * @param tree
   * @param x
   * @param y
   * @param blockWidth
   * @param colors
   * @param {BarRenderer} renderer bar renderer
   */
  const drawTreeNode = (context, tree, x, y, blockWidth, colors, renderer) => {
    if (!tree) {
      return;
    }
    // This is a leaf
    const offset = blockWidth / 2;
    if (tree.join) {
      for (const currentBarIndex of tree) {
        if (blockWidth > 20) {
          context.fillText(currentBarIndex, x + offset, y);
        }
        const notes = measures[currentBarIndex];
        // To know if highlighted, we have to check if any identical is selected
        let highlight = false;
        for (const [index, v] of measureDists[currentBarIndex].entries()) {
          if (v === 0 && index === selectedMeasure) {
            highlight = true;
            break;
          }
        }
        if (highlight) {
          renderer.drawHighlightBorder(context, x, y);
        }
        const bgColor = colors[currentBarIndex] ?? '#f8f8f8';
        renderer.render(context, 0, notes, x, y, bgColor, {
          radius: 3,
          showFrets: true,
        });
        x += blockWidth;
      }
      return;
    }
    // This is not a leaf
    // Pre
    if (tree.pre) {
      drawTreeNode(context, tree.pre, x, y, blockWidth, colors, renderer);
      x += tree.pre.length * blockWidth;
    }
    // Repetition
    const treeWidth = tree.seq.length * blockWidth;
    context.fillText(`${tree.rep} x`, x + treeWidth / 2, y);
    Canvas.drawBracketH(context, x + 3, y + 5, treeWidth - 6, 5, true);
    drawTreeNode(context, tree.seq, x, y + 25, blockWidth, colors, renderer);

    // Post
    if (tree.post) {
      x += tree.seq.length * blockWidth;
      drawTreeNode(context, tree.post, x, y, blockWidth, colors, renderer);
    }
  };

  // On click select clicked bar
  const onClick = (event) => {
    event.preventDefault();
    const column = Math.floor((event.offsetX - 10) / blockWidth);
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

  afterUpdate(() => drawTreeGraph(hierarchy, blockWidth, measureColors));
</script>

<main style={`height: ${height}px`}>
  <div class="overviewTitle">Compressed</div>
  <div class="control">
    <label>
      Zoom
      <input type="range" bind:value={zoom} min={1} max={20} step={1} />
      {zoom}x
    </label>
  </div>
  <div
    class="canvasContainer"
    style={`max-width: ${width}px`}
    bind:this={container}>
    <canvas
      width={width * zoom}
      height={canvasHeight}
      bind:this={canvas}
      on:click={onClick}
      on:mousewheel={onMouseWheel} />
  </div>
</main>

<style>
  main {
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 10px #ccc;
  }

  .control {
    margin-bottom: 4px;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    justify-items: center;
    align-items: center;
  }

  .canvasContainer {
    overflow-x: scroll;
  }
</style>
