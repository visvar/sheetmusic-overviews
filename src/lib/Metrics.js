import * as d3 from 'd3'


export function getColorViaMetric(
  metric,
  noteCollections,
  colormap
) {
  let values;
  switch (metric) {
    case 'noteCount':
      values = noteCollections.map(d => d.length)
      break
    case 'meanPitch':
      values = noteCollections.map(d => d3.mean(d, n => n.pitch))
      break
    case 'pitchRangeSpan':
      values = noteCollections.map(d => d3.extent(d, n => n.pitch))
      break
    case 'pitchVariance':
      values = noteCollections.map(d => d3.variance(d, n => n.pitch))
      break
    // TODO: more from moshviz
  }
  const scaleColor = d3.scaleLinear()
    .domain(d3.extent(values))
    .range([0, 1])
  return values.map((d) => colormap(scaleColor(d)))
}
